import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback = () => {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Check for OAuth errors
        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Authentication code not received');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Process OAuth callback
        const result = await handleOAuthCallback(provider, code, state);

        if (result.success) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => navigate('/chat'), 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Authentication failed');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processCallback();
  }, [provider, searchParams, handleOAuthCallback, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getProviderName = () => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'github':
        return 'GitHub';
      default:
        return provider;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {getIcon()}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {status === 'processing' && `Authenticating with ${getProviderName()}`}
          {status === 'success' && 'Welcome to Queryous!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>

        {status === 'processing' && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-500">Please wait while we complete your authentication...</p>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Return Home
          </button>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">Authentication successful!</span>
            </div>
            <p className="text-sm text-gray-500">
              You'll be redirected to your dashboard shortly...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
