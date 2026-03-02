# 🔍 Debugging: Share URL Blank Page Issue

Your changes have been pushed to GitHub and Render is redeploying. Here's how to debug the blank page issue:

## Step 1: Check Browser Console (F12)

When you visit the share URL and see a blank page:

1. **Press F12** to open Developer Tools
2. **Click "Console" tab**
3. Look for messages starting with emoji indicators:
   - 🔍 = Share verification starting
   - ✅ = Success messages
   - ❌ = Error messages
   - ⏰ = Timeout/expiration checks

4. **Copy the full console output** and check what the last message is

### Expected console output (success):
```
🔍 Verifying share with ID: e08c750abae0d688...
📍 API_BASE_URL: https://secure-file-backend-98yd.onrender.com/api
🌐 Fetching from URL: https://secure-file-backend-98yd.onrender.com/api/shares/verify/e08c750abae0d688...
✅ Share verification successful
📦 Response data: {fileName: "Screenshot.png", fileSize: 273200, isPasswordProtected: false, ...}
```

---

## Step 2: Check Backend Logs

Go to Render and check what the backend is logging:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click Backend Service**: `secure-file-backend-98yd`
3. **Click "Logs" tab** (right side)
4. **Search for your shareId** in the logs

### Look for these patterns:

#### ✅ SUCCESS:
```
📋 Share verification request for: e08c750abae0d688
🔍 Share found: YES
⏰ Checking expiration - Now: [time] Expires: [time]
✅ Share verification successful
📦 Response: {fileName: "Screenshot.png", ...}
```

#### ❌ COMMON ERRORS:

**Error 1: Share not found**
```
📋 Share verification request for: e08c750abae0d688
🔍 Share found: NO
❌ Share not found for ID: e08c750abae0d688
```
**Solution**: Verify the URL shareId matches what's in the database

**Error 2: File associated with share not found**
```
📋 Share verification request for: e08c750abae0d688
🔍 Share found: YES
❌ File associated with share not found
```
**Solution**: File may have been deleted; check if original file still exists

**Error 3: Share has expired**
```
⏰ Checking expiration - Now: [current time] Expires: [past time]
⏰ Share has expired
```
**Solution**: Share link expired; create a new share with longer expiration

---

## Step 3: Network Tab Debugging

1. **Open Dev Tools** (F12)
2. **Go to "Network" tab**
3. **Refresh the page** (F5)
4. **Look at the requests**, especially:
   - `verify/{shareId}` - Should return 200 with share data
   - Check response for errors

### Expected Network Response:
```json
{
  "fileName": "Screenshot.png",
  "fileSize": 273200,
  "isPasswordProtected": false,
  "expiresAt": "2026-03-03T12:00:00.000Z",
  "emailDelivered": false
}
```

---

## Step 4: Possible Causes & Solutions

### Issue: "Cannot connect to server" error

**Cause**: Backend API unreachable

**Check**:
1. Render backend is running (green light on dashboard)
2. API URL is correct: `https://secure-file-backend-98yd.onrender.com/api`
3. No network connectivity issues

**Solution**:
- Wait 2-5 minutes for backend to finish deploying
- Try clearing browser cache (Ctrl+Shift+Delete)
- Try in incognito window (Ctrl+Shift+N)

### Issue: "Share not found" error

**Cause**: ShareId doesn't exist in database

**Check**:
1. ShareId in URL is correct
2. Share wasn't deleted
3. Share exists in MongoDB

**Solution**:
- Create a new share to test
- Check MongoDB to verify share record exists

### Issue: "Share has expired" error

**Cause**: Expiration time has passed

**Check**:
1. Expiration time in database vs current time
2. Server time is correct

**Solution**:
- Create a new share with longer expiration (e.g., 7 days)

### Issue: Blank page with no errors

**Cause**: React component not rendering or error boundary catching error

**Check**:
1. Browser console for errors
2. Network tab for failed API calls
3. Render backend logs

**Solution**:
- Hard refresh (Ctrl+Shift+R)
- Clear cache completely
- Check all error messages in previous steps

---

## Step 5: Share Your Debugging Info

If the issue persists, gather:

1. **Console output** (F12)
2. **Backend logs** from Render (share a screenshot)
3. **Network response** for the verify request
4. **ShareId** from the URL
5. **Error message** if any

Then share this information to get help.

---

## Temporary Workaround

If the share URL still doesn't work:

1. The **OTP code is displayed** in the share modal
2. Share the **OTP code + shareId** with the recipient manually
3. They can construct the URL: `https://secure-file-frontend-asme.onrender.com/share/{shareId}`
4. The page should load and ask for OTP
5. They enter the OTP you provided

This proves the system works; the blank page is just a UI rendering issue.

---

## Testing Checklist

- [ ] Deployed code to Render (check GitHub integrations)
- [ ] Render backend finished redeploying (green status)
- [ ] Render frontend finished redeploying (green status)
- [ ] Clear browser cache
- [ ] Open share URL in new incognito window
- [ ] Check F12 console for errors
- [ ] Check Render backend logs
- [ ] Verify shareId exists in URL
