import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignLayout } from '@/components/campaign/CampaignLayout';
import { ArrowLeft, Camera, RotateCcw, CheckCircle2, Loader2, AlertCircle, Info } from 'lucide-react';
import { apiClient } from '@/services/api';

export function CameraCapturePage() {
  const { dispatch, goToStep, state } = useCampaign();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isStarting, setIsStarting] = useState(false);

  const startCamera = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    setCameraError(null);
    
    // Show camera view first so video element exists
    setShowCamera(true);

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera not supported on this browser. Please use a modern mobile browser.');
      setIsStarting(false);
      setShowCamera(false);
      return;
    }

    // Small delay to ensure video element is mounted
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Try with environment camera first (back camera on mobile)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false,
        });
      } catch {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      
      // Wait for video ref to be available
      let attempts = 0;
      while (!videoRef.current && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        
        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video failed to load'));
          };
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout fallback
          setTimeout(resolve, 5000);
        });

        // Force play with multiple attempts
        const playVideo = async () => {
          for (let i = 0; i < 3; i++) {
            try {
              await video.play();
              return true;
            } catch (e) {
              await new Promise(r => setTimeout(r, 200));
            }
          }
          return false;
        };
        
        const played = await playVideo();
        if (!played) {
          console.warn('Video autoplay failed after retries');
        }
      } else {
        throw new Error('Video element not available');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setShowCamera(false);
      
      let errorMessage = 'Camera access denied. Please allow camera permissions to continue.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission was denied. Please enable camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device. Please use a device with a camera.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another app. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera settings not supported. Please try again.';
      } else if (err.name === 'TypeError') {
        errorMessage = 'Camera not available. Please check your device settings.';
      }
      
      setCameraError(errorMessage);
    } finally {
      setIsStarting(false);
    }
  }, [isStarting]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);

        // Convert base64 to File
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `milo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setCapturedFile(file);
          }
        }, 'image/jpeg', 0.8);

        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setUploadError(null);
    startCamera();
  };

  const handleUpload = async () => {
    if (!capturedImage || !capturedFile || !state.currentCodeId) {
      setUploadError('Missing image or code information. Please try again.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await apiClient.createEntry(capturedFile, state.currentCodeId);

      if (response.success) {
        const newSubmission = {
          id: response.entry.id.toString(),
          uniqueCode: state.currentCode,
          imageUrl: response.entry.image_url,
          status: response.entry.review_status === 'approved' ? 'approved' as const : 'pending' as const,
          submittedAt: new Date(response.entry.created_at),
        };

        dispatch({ type: 'SET_IMAGE', payload: capturedImage });
        dispatch({ type: 'ADD_SUBMISSION', payload: newSubmission });

        goToStep('confirmation');
      } else {
        setUploadError(response.message || 'Upload failed');
      }
    } catch (err: any) {
      // Handle fraud detection errors specially
      if (err.message && typeof err.message === 'string') {
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.error_type === 'fraud_detection') {
            setUploadError(errorData.details?.help_text || errorData.message);
          } else {
            setUploadError(err.message);
          }
        } catch {
          setUploadError(err.message);
        }
      } else {
        setUploadError('Failed to upload image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CampaignLayout showSteps currentStep={4} totalSteps={5}>
      <div className="flex-1 px-4 pb-8 flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => {
            stopCamera();
            goToStep('code-entry');
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl">Capture Your Product</CardTitle>
            <CardDescription className="text-xs">
              Take a clear photo showing the MILO pack with the code visible
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 pt-0">
            {/* Requirements */}
            <div className="bg-muted rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Show MILO RTD pack clearly</p>
                  <p>• Unique code must be visible</p>
                  <p>• Paper straw attached</p>
                  <p>• Consumption circle punched</p>
                </div>
              </div>
            </div>

            {/* Camera/Image Area */}
            <div className="flex-1 relative rounded-xl overflow-hidden bg-foreground/5 min-h-[280px]">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-sm text-destructive mb-4">{cameraError}</p>
                  <Button variant="outline" onClick={startCamera}>
                    Try Again
                  </Button>
                </div>
              ) : capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured product"
                  className="w-full h-full object-cover"
                />
              ) : showCamera ? (
              <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    webkit-playsinline="true"
                    className="w-full h-full object-cover"
                  />
                  {/* Camera overlay */}
                  <div className="absolute inset-4 border-2 border-primary-foreground/50 rounded-xl pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-4 flex justify-center">
                    <Button
                      variant="hero"
                      size="icon"
                      className="w-16 h-16 rounded-full"
                      onClick={capturePhoto}
                    >
                      <Camera className="w-8 h-8" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 gradient-milo rounded-full flex items-center justify-center mb-4">
                    <Camera className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Tap to open camera</p>
                  <Button variant="hero" onClick={startCamera} disabled={isStarting}>
                    {isStarting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Opening Camera...
                      </>
                    ) : (
                      'Start Camera'
                    )}
                  </Button>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-destructive font-medium mb-1">Upload Failed</p>
                    <p className="text-xs text-destructive/80 whitespace-pre-line">{uploadError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {capturedImage && (
              <div className="mt-4 space-y-3">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Photo
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={retakePhoto}
                  disabled={isUploading}
                >
                  <RotateCcw className="w-5 h-5" />
                  Retake Photo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
