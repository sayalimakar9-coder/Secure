import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  Divider,
  Switch,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface FileShareModalProps {
  open: boolean;
  onClose: () => void;
  file: any;
}

const FileShareModal: React.FC<FileShareModalProps> = ({ open, onClose, file }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState('download');
  const [expiryHours, setExpiryHours] = useState(24);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareOtp, setShareOtp] = useState('');
  const [emailSendFailed, setEmailSendFailed] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'direct'>('direct');

  const handleClose = () => {
    setRecipientEmail('');
    setPermission('download');
    setExpiryHours(24);
    setPasswordProtect(false);
    setPassword('');
    setError('');
    setSuccess(false);
    setShareLink('');
    setShareOtp('');
    setEmailSendFailed(false);
    setShareMethod('direct');
    onClose();
  };

  const validateForm = () => {
    if (!recipientEmail.trim()) {
      setError('Recipient email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (shareMethod !== 'direct' && passwordProtect && !password.trim()) {
      setError('Password is required when password protection is enabled');
      return false;
    }
    setError('');
    return true;
  };

  const handleShare = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/shares`,
        {
          fileId: file._id || file.id,
          recipientEmail,
          permission,
          expiryHours,
          passwordProtect: shareMethod !== 'direct' ? passwordProtect : false,
          password: shareMethod !== 'direct' && passwordProtect ? password : undefined,
          shareMethod
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );

      setSuccess(true);

      if (response.data.shareLink) {
        setShareLink(response.data.shareLink);
      }
      if (response.data.otp) {
        setShareOtp(response.data.otp);
      }
      if (response.data.emailSent === false && shareMethod === 'email') {
        setEmailSendFailed(true);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error sharing file:', error);
      setError(error.response?.data?.message || 'Failed to share file. Please try again.');
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  const renderShareMethodInfo = () => {
    switch (shareMethod) {
      case 'direct':
        return (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2">
              <strong>Direct Share:</strong> File will appear directly in the recipient's <strong>"Received Files"</strong> tab.
              No link or OTP needed — they just log in and see it.
            </Typography>
          </Alert>
        );
      case 'link':
        return (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2">
              <strong>Share via Link:</strong> You'll get a share link and OTP code.
              Send both to the recipient — they'll need the OTP to access the file.
            </Typography>
          </Alert>
        );
      case 'email':
        return (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2">
              <strong>Share via Email:</strong> The recipient will receive an email with
              the share link and OTP code automatically.
            </Typography>
          </Alert>
        );
    }
  };

  const renderSuccessContent = () => {
    if (shareMethod === 'direct') {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            File Shared Successfully!
          </Typography>
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>{file?.originalName}</strong> has been shared directly to <strong>{recipientEmail}</strong>'s inbox.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            The recipient will see this file in their <strong>"Received Files"</strong> tab when they log in.
            No link or verification code is needed.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label={`Permission: ${permission === 'view' ? 'View Only' : permission === 'download' ? 'Download' : 'Edit'}`} color="primary" variant="outlined" />
            <Chip label={`Expires: ${expiryHours === 1 ? '1 hour' : expiryHours === 24 ? '1 day' : expiryHours === 72 ? '3 days' : '1 week'}`} variant="outlined" />
          </Box>
        </Box>
      );
    }

    // Link or Email share result
    return (
      <Box sx={{ mt: 1 }}>
        {shareMethod === 'email' && emailSendFailed ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            File shared but email couldn't be sent. Share the link and OTP manually.
          </Alert>
        ) : shareMethod === 'email' ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            File shared! Email with access details sent to {recipientEmail}.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            Share link generated! Send the link and OTP code to {recipientEmail}.
          </Alert>
        )}

        {/* Share Link */}
        {shareLink && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              📎 Share Link:
            </Typography>
            <TextField
              fullWidth
              value={shareLink}
              size="small"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => copyText(shareLink)} edge="end" title="Copy link">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        )}

        {/* OTP Code */}
        {shareOtp && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              🔑 Verification Code (OTP):
            </Typography>
            <TextField
              fullWidth
              value={shareOtp}
              size="small"
              InputProps={{
                readOnly: true,
                sx: {
                  fontSize: '1.4rem',
                  letterSpacing: '0.4rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontFamily: 'monospace'
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => copyText(shareOtp)} edge="end" title="Copy OTP">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Recipient needs this code to access the file via the share link.
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`Permission: ${permission === 'view' ? 'View Only' : permission === 'download' ? 'Download' : 'Edit'}`} size="small" color="primary" variant="outlined" />
          <Chip label={`Expires: ${expiryHours === 1 ? '1 hour' : expiryHours === 24 ? '1 day' : expiryHours === 72 ? '3 days' : '1 week'}`} size="small" variant="outlined" />
          {passwordProtect && <Chip label="🔒 Password Protected" size="small" variant="outlined" />}
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Share File
          {file && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              {file.originalName}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent>
          {!success ? (
            <Box sx={{ mt: 1 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {/* Share Method Selector */}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                How would you like to share?
              </Typography>
              <ToggleButtonGroup
                value={shareMethod}
                exclusive
                onChange={(_, val) => { if (val) setShareMethod(val); }}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="direct" sx={{ textTransform: 'none', py: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <InboxIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: shareMethod === 'direct' ? 'bold' : 'normal' }}>
                      Direct Inbox
                    </Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="link" sx={{ textTransform: 'none', py: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <LinkIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: shareMethod === 'link' ? 'bold' : 'normal' }}>
                      Share Link
                    </Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="email" sx={{ textTransform: 'none', py: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: shareMethod === 'email' ? 'bold' : 'normal' }}>
                      Send Email
                    </Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>

              {renderShareMethodInfo()}

              <Divider sx={{ my: 1 }} />

              {/* Recipient Email */}
              <FormControl fullWidth margin="normal">
                <TextField
                  label="Recipient Email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  type="email"
                  size="small"
                />
              </FormControl>

              {/* Permission */}
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="permission-label">Permission</InputLabel>
                <Select
                  labelId="permission-label"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  label="Permission"
                >
                  <MenuItem value="view">View Only</MenuItem>
                  <MenuItem value="download">Allow Download</MenuItem>
                  <MenuItem value="edit">Allow Edit</MenuItem>
                </Select>
              </FormControl>

              {/* Expiry */}
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="expiry-label">Expires After</InputLabel>
                <Select
                  labelId="expiry-label"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  label="Expires After"
                >
                  <MenuItem value={1}>1 hour</MenuItem>
                  <MenuItem value={24}>1 day</MenuItem>
                  <MenuItem value={72}>3 days</MenuItem>
                  <MenuItem value={168}>1 week</MenuItem>
                </Select>
              </FormControl>

              {/* Password Protection (only for link/email methods) */}
              {shareMethod !== 'direct' && (
                <Box sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={passwordProtect}
                        onChange={(e) => setPasswordProtect(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Password Protection"
                  />
                  {passwordProtect && (
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      margin="dense"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                              {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          ) : (
            renderSuccessContent()
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          {!success && (
            <Button
              onClick={handleShare}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> :
                shareMethod === 'direct' ? <InboxIcon /> :
                  shareMethod === 'link' ? <LinkIcon /> : <EmailIcon />
              }
            >
              {loading ? 'Sharing...' :
                shareMethod === 'direct' ? 'Share to Inbox' :
                  shareMethod === 'link' ? 'Generate Link' : 'Send Email'
              }
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={linkCopied}
        autoHideDuration={3000}
        onClose={() => setLinkCopied(false)}
        message="Copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default FileShareModal;