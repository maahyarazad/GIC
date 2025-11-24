export default interface ApiError {
  success: false;
  message: string;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}