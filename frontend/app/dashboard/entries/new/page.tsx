'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { entriesApi } from '@/lib/api/entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function NewEntryPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Code validation state
  const [codeInput, setCodeInput] = useState('');
  const [codeValidated, setCodeValidated] = useState(false);
  const [validatedCodeId, setValidatedCodeId] = useState<number | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Check for duplicates
    setIsChecking(true);
    try {
      const result = await entriesApi.checkDuplicate(file);
      if (result.is_duplicate) {
        setError('This image has already been submitted. Please use a different image.');
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      console.error('Error checking duplicate:', err);
      // Extract error message from Pydantic validation error
      let errorMessage = 'Failed to check for duplicates';
      if (err.response?.data?.detail) {
        // If detail is an array (Pydantic validation error)
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  const handleValidateCode = async () => {
    if (!codeInput.trim()) {
      setCodeError('Please enter a code');
      return;
    }

    setIsValidatingCode(true);
    setCodeError(null);

    try {
      const result = await entriesApi.validateCode(codeInput.trim().toUpperCase());

      if (result.success && result.code_id) {
        setCodeValidated(true);
        setValidatedCodeId(result.code_id);
        setCodeError(null);
      } else {
        setCodeError(result.message);
      }
    } catch (err: any) {
      console.error('Error validating code:', err);
      let errorMessage = 'Failed to validate code. Please try again.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      }
      setCodeError(errorMessage);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !validatedCodeId) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await entriesApi.createEntry(selectedFile, validatedCodeId);
      setSuccess(true);

      // Refresh user data to update entry count
      await refreshUser();

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error uploading entry:', err);

      // Check if it's a fraud detection error with detailed information
      const errorDetail = err.response?.data?.detail;

      if (errorDetail?.error_type === 'fraud_detection') {
        // Fraud detection error with detailed information
        const details = errorDetail.details;
        const signals = details.signals || [];

        // Build formatted error message with all fraud detection details
        const fraudMessage = `${errorDetail.message}

Similarity Score: ${(details.fraud_score * 100).toFixed(0)}% (threshold: ${(details.threshold * 100).toFixed(0)}%)
${signals.length > 0 ? '\nReasons:\n' + signals.map((s: string) => `• ${s}`).join('\n') : ''}

${details.recommendation}

${details.help_text}`;

        setError(fraudMessage);
      } else {
        // Generic error handling for non-fraud errors
        let errorMessage = 'Failed to upload entry. Please try again.';
        if (err.response?.data?.detail) {
          // If detail is an array (Pydantic validation error)
          if (Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail.map((e: any) => e.msg).join(', ');
          } else if (typeof err.response.data.detail === 'string') {
            errorMessage = err.response.data.detail;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      }

      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-bold text-center">Entry Submitted Successfully!</h2>
              <p className="text-muted-foreground text-center">
                Your entry has been submitted. Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Upload New Entry</h1>
        <p className="text-muted-foreground mt-2">
          Upload a photo of your Milo 3M RTD product to enter the campaign
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1: Code Validation */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Your Code</CardTitle>
            <CardDescription>
              Enter the unique code from your Milo 3M RTD pack
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!codeValidated ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium mb-2">
                    Unique Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., MILO12345)"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    disabled={isValidatingCode}
                    maxLength={50}
                  />
                </div>

                {codeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{codeError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleValidateCode}
                  disabled={isValidatingCode || !codeInput.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isValidatingCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating Code...
                    </>
                  ) : (
                    'Validate Code'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-600 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    Code validated successfully! You can now upload your image.
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Your Code:</p>
                  <p className="text-lg font-bold text-green-600 mt-1">{codeInput}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Upload Image</CardTitle>
            <CardDescription>
              {codeValidated
                ? "Select or drag and drop an image of your Milo 3M RTD product"
                : "Please validate your code first"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!codeValidated ? (
              <div className="border-2 border-dashed rounded-lg p-12 text-center bg-gray-50">
                <Upload className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">
                  Validate your code to unlock image upload
                </p>
              </div>
            ) : (
              <>
                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-600 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {isChecking && (
                      <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>Checking for duplicates...</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
                  </Alert>
                )}

                {selectedFile && !error && (
                  <Button
                    onClick={handleSubmit}
                    disabled={isUploading || isChecking}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit Entry
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Requirements Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>Please ensure your submission meets these requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-3">Code Requirements</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Each code can only be used once</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Code must be from a valid Milo 3M RTD pack</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3">Image Requirements</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Clear photo of Milo 3M RTD product</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Product label must be visible</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Image should be well-lit and in focus</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>File size must be less than 10MB</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Supported formats: PNG, JPG, GIF</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900">Your Status</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {10 - (user?.entry_count || 0)} entries remaining
            </p>
            <p className="text-xs text-green-700 mt-1">
              out of 10 maximum entries
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
