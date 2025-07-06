
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { VideoIcon, DownloadIcon, ClockIcon, CheckCircleIcon, XCircleIcon, PlayIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import type { VideoConversionRequest, CreateVideoConversionRequestInput, ConversionStatus } from '../../server/src/schema';

function App() {
  const [requests, setRequests] = useState<VideoConversionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ConversionStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateVideoConversionRequestInput>({
    original_url: '',
    title: '',
    description: ''
  });

  const loadRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      setConnectionError(null);
      
      const filters = statusFilter === 'all' ? undefined : { status: statusFilter };
      const result = await trpc.getVideoConversionRequests.query(filters);
      setRequests(result);
    } catch (err) {
      console.error('Failed to load requests:', err);
      
      // More specific error handling for different error types
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('econnrefused') || errorMessage.includes('failed to fetch')) {
          setConnectionError('🔌 Unable to connect to the server. Please ensure the backend is running on the correct port and try again.');
        } else if (errorMessage.includes('json') || errorMessage.includes('unexpected end of json')) {
          setConnectionError('📡 Server returned an invalid response. The backend might be starting up or experiencing issues.');
        } else if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
          setConnectionError('⚠️ Server error occurred. Please check the backend logs and try again.');
        } else if (errorMessage.includes('cors')) {
          setConnectionError('🚫 Cross-origin request blocked. Please check the server CORS configuration.');
        } else {
          setConnectionError(`❌ Server error: ${err.message}`);
        }
      } else {
        setConnectionError('❓ An unexpected error occurred while loading requests.');
      }
    } finally {
      setIsLoadingRequests(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestData = {
        original_url: formData.original_url,
        title: formData.title || undefined,
        description: formData.description || undefined
      };

      const response = await trpc.createVideoConversionRequest.mutate(requestData);
      setRequests((prev: VideoConversionRequest[]) => [response, ...prev]);
      setFormData({
        original_url: '',
        title: '',
        description: ''
      });
      setSuccess('🎉 Video conversion request created successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to create request:', err);
      
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
          setError('🔌 Unable to connect to the server. Please check your connection and try again.');
        } else if (errorMessage.includes('url') || errorMessage.includes('invalid url')) {
          setError('🔗 Please enter a valid video URL (e.g., YouTube, Vimeo).');
        } else if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
          setError('📝 Please check your input and try again.');
        } else if (errorMessage.includes('500')) {
          setError('⚠️ Server error occurred. Please try again later.');
        } else {
          setError(`❌ Failed to create request: ${err.message}`);
        }
      } else {
        setError('❌ Failed to create video conversion request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ConversionStatus) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: PlayIcon, label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon, label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon, label: 'Failed' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 border`}>
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <VideoIcon className="text-purple-600" size={40} />
            Video Shorts Converter
          </h1>
          <p className="text-lg text-gray-600">
            Transform your long videos into engaging short clips ✨
          </p>
        </div>

        {/* Connection Error */}
        {connectionError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              <span className="flex-1">{connectionError}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadRequests()}
                className="ml-4 shrink-0"
              >
                <RefreshCwIcon size={14} className="mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2">
              <VideoIcon size={24} />
              Submit Your Video
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL *
                </label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  value={formData.original_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateVideoConversionRequestInput) => ({ ...prev, original_url: e.target.value }))
                  }
                  required
                  className="text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <Input
                  placeholder="Give your video a catchy title..."
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateVideoConversionRequestInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Describe your video or add any special instructions..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateVideoConversionRequestInput) => ({ ...prev, description: e.target.value }))
                  }
                  className="text-base min-h-[100px]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !!connectionError}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating Request...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <VideoIcon size={20} />
                    Convert to Short Video 🚀
                  </span>
                )}
              </Button>

              {connectionError && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  <strong>💡 Troubleshooting Tips:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Make sure the backend server is running on port 2022</li>
                    <li>Check that your firewall isn't blocking the connection</li>
                    <li>Verify the server logs for any error messages</li>
                    <li>Try refreshing the page if the issue persists</li>
                  </ul>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Filter and Requests */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Your Conversion Requests</h2>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => loadRequests()}
                disabled={isLoadingRequests}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon size={16} className={isLoadingRequests ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <Select value={statusFilter} onValueChange={(value: ConversionStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingRequests ? (
            <Card className="text-center py-12 bg-white/50">
              <CardContent className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mx-auto"></div>
                <p className="text-gray-600">Loading your requests...</p>
              </CardContent>
            </Card>
          ) : connectionError ? (
            <Card className="text-center py-12 border-2 border-dashed border-red-300 bg-red-50/50">
              <CardContent className="space-y-4">
                <AlertCircleIcon size={48} className="mx-auto text-red-400" />
                <h3 className="text-xl font-semibold text-red-700">Connection Error</h3>
                <p className="text-red-600 max-w-md mx-auto">
                  Unable to load your requests. This usually means the backend server isn't running or accessible.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => loadRequests()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <RefreshCwIcon size={16} className="mr-2" />
                    Try Again
                  </Button>
                  <p className="text-sm text-red-500">
                    Expected server URL: /api (check your backend configuration)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card className="text-center py-12 border-2 border-dashed border-gray-300 bg-white/50">
              <CardContent className="space-y-4">
                <VideoIcon size={48} className="mx-auto text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700">No conversion requests yet</h3>
                <p className="text-gray-500">
                  Submit your first video above to get started! 🎬
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {requests.map((request: VideoConversionRequest) => (
                <Card key={request.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {request.title || 'Video Conversion Request'}
                        </h3>
                        <p className="text-sm text-gray-600 break-all">
                          <strong>Original URL:</strong> {request.original_url}
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Description:</strong> {request.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>Created:</strong> {formatDate(request.created_at)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Updated:</strong> {formatDate(request.updated_at)}
                        </p>
                        {request.completed_at && (
                          <p className="text-sm text-gray-600">
                            <strong>Completed:</strong> {formatDate(request.completed_at)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {request.status === 'completed' && request.short_video_url && (
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => window.open(request.short_video_url!, '_blank')}
                            >
                              <PlayIcon size={16} className="mr-2" />
                              View Short Video
                            </Button>
                            {request.download_url && (
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => window.open(request.download_url!, '_blank')}
                              >
                                <DownloadIcon size={16} className="mr-2" />
                                Download Video
                              </Button>
                            )}
                          </div>
                        )}

                        {request.status === 'failed' && request.error_message && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertCircleIcon className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 text-sm">
                              {request.error_message}
                            </AlertDescription>
                          </Alert>
                        )}

                        {request.status === 'processing' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm">Processing your video...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
