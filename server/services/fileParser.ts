import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

export interface LinkedInConnection {
  firstName: string;
  lastName: string;
  profileUrl: string;
  email?: string;
  company?: string;
  position?: string;
  connectedOn?: string;
}

export function parseResumeFile(filePath: string): string {
  try {
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.txt') {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    // For PDF/DOCX, we'll need additional libraries in a real implementation
    // For now, we'll assume text extraction is handled elsewhere
    throw new Error(`File type ${extension} not supported yet. Please use TXT files.`);
    
  } catch (error) {
    throw new Error(`Failed to parse resume file: ${error}`);
  }
}

export function parseLinkedInCSV(filePath: string): LinkedInConnection[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records.map((record: any, index: number) => {
      const firstName = record['First Name'] || record['firstName'] || '';
      const lastName = record['Last Name'] || record['lastName'] || '';
      const profileUrl = record['URL'] || record['Profile URL'] || record['profileUrl'] || '';
      
      if (!firstName || !lastName || !profileUrl) {
        throw new Error(`Invalid data at row ${index + 1}: Missing required fields (First Name, Last Name, URL)`);
      }

      return {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileUrl: profileUrl.trim(),
        email: record['Email Address'] || record['email'] || '',
        company: record['Company'] || record['company'] || '',
        position: record['Position'] || record['position'] || '',
        connectedOn: record['Connected On'] || record['connectedOn'] || ''
      };
    });

  } catch (error) {
    throw new Error(`Failed to parse LinkedIn CSV: ${error}`);
  }
}

export function saveUploadedFile(file: any, uploadDir: string): string {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadDir, fileName);
  
  fs.writeFileSync(filePath, file.buffer);
  return filePath;
}
