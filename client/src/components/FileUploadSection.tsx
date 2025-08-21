import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadSectionProps {
  sessionId: string | null;
  filesUploaded: { resume: boolean; connections: boolean };
  onUploadComplete: () => void;
}

export default function FileUploadSection({ sessionId, filesUploaded, onUploadComplete }: FileUploadSectionProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ resume?: File; connections?: File }>({});
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: 'resume' | 'connections') => {
    if (!sessionId) {
      toast({ title: "Error", description: "Session not initialized", variant: "destructive" });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append(type, file);

      const response = await fetch(`/api/sessions/${sessionId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
      
      toast({
        title: "Upload Successful",
        description: `${type === 'resume' ? 'Resume' : 'Connections CSV'} uploaded successfully`,
      });

      onUploadComplete();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'resume' | 'connections') => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-upload text-blue-500 mr-2"></i>
        File Uploads
      </h2>
      
      {/* Resume Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onDrop={(e) => handleDrop(e, 'resume')}
          onDragOver={handleDragOver}
          onClick={() => resumeInputRef.current?.click()}
        >
          <i className="fas fa-file-text text-gray-400 text-2xl mb-2"></i>
          <p className="text-sm text-gray-600">
            Drop your resume here or <span className="text-blue-600 font-medium">browse files</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Supports PDF, DOCX, TXT</p>
        </div>
        
        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'resume');
          }}
          className="hidden"
        />
        
        {filesUploaded.resume && uploadedFiles.resume && (
          <div className="mt-2">
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-sm text-green-800">{uploadedFiles.resume.name}</span>
              </div>
              <button 
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  setUploadedFiles(prev => ({ ...prev, resume: undefined }));
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connections CSV Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Connections CSV</label>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onDrop={(e) => handleDrop(e, 'connections')}
          onDragOver={handleDragOver}
          onClick={() => csvInputRef.current?.click()}
        >
          <i className="fas fa-table text-gray-400 text-2xl mb-2"></i>
          <p className="text-sm text-gray-600">
            Drop your connections CSV here or <span className="text-blue-600 font-medium">browse files</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Must include: First Name, Last Name, URL, Company, Position</p>
        </div>
        
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'connections');
          }}
          className="hidden"
        />
        
        {filesUploaded.connections && uploadedFiles.connections && (
          <div className="mt-2">
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span className="text-sm text-green-800">{uploadedFiles.connections.name}</span>
              </div>
              <button 
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  setUploadedFiles(prev => ({ ...prev, connections: undefined }));
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
