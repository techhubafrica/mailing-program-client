import { useState } from "react"
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function CSVUploadDialog({ onContactsUploaded }) {
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast.error("Invalid file type", {
        description: "Please upload a CSV file",
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 5MB",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResults(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Using XMLHttpRequest for better upload progress tracking
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      }

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (e) {
              reject(new Error('Invalid JSON response from server'))
            }
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`))
          }
        }
        
        xhr.onerror = () => reject(new Error('Network error occurred'))
        
        xhr.open('POST', 'https://mailing-program-server.onrender.com/api/contacts/upload')
        xhr.send(formData)
      })

      const data = await uploadPromise
      setUploadResults(data)
      
      // Always trigger onContactsUploaded if we have imported contacts
      if (data.imported > 0) {
        onContactsUploaded?.()
      }

      // Show appropriate toast message
      if (data.errors && data.errors.length > 0) {
        toast.warning("Upload completed with some issues", {
          description: `Imported: ${data.imported || 0}, Errors: ${data.errors.length}`,
        })
      } else {
        toast.success("Upload successful", {
          description: `Imported ${data.imported || 0} contacts${data.duplicates ? `, ${data.duplicates} duplicates skipped` : ''}`,
        })
      }

      // Close dialog after successful upload, regardless of errors
      setOpen(false)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Upload failed", {
        description: error.message || "Please try again",
      })
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    
    const files = event.dataTransfer.files
    if (files?.length > 0) {
      event.target.files = files // Simulate file input change
      handleFileUpload(event)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Contacts CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with the following columns: email (required), name, organization, tags.
            Tags should be comma-separated.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Uploading... {uploadProgress}%
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSV file (MAX. 5MB)</p>
                </>
              )}
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
        {isUploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
