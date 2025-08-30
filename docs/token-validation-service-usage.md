# Token Validation Service Usage Guide

## Overview

The `TokenValidationService` provides centralized, secure token handling for password reset flows. It supports multiple token formats (standard and token_hash) while maintaining security best practices.

## Key Features

- **Multiple Token Format Support**: Handles both standard (access_token + refresh_token) and token_hash formats
- **Secure Validation**: Validates token structure without creating persistent sessions
- **Centralized Error Handling**: Provides user-friendly error messages for different failure scenarios
- **Security-First Design**: Ensures immediate sign-out after password updates
- **TypeScript Support**: Full type safety with proper interfaces

## Basic Usage

### 1. Extract Tokens from URL

```typescript
import { TokenValidationService } from '@/lib/password-reset-token-validation';

// From search parameters and hash
const searchParams = new URLSearchParams(window.location.search);
const hash = window.location.hash;
const tokens = TokenValidationService.extractTokensFromUrl(searchParams, hash);

// Or use the convenience function
import { extractTokensFromBrowser } from '@/lib/password-reset-token-validation';
const tokens = extractTokensFromBrowser();
```

### 2. Validate Token Structure

```typescript
if (tokens) {
  const validation = await TokenValidationService.validateTokensSecurely(tokens);
  
  if (validation.isValid) {
    // Tokens are structurally valid
    console.log('Tokens validated successfully');
  } else {
    // Handle validation error
    console.error(validation.userMessage);
  }
}
```

### 3. Update Password Securely

```typescript
try {
  await TokenValidationService.updatePasswordSecurely(tokens, newPassword);
  console.log('Password updated successfully');
  // Redirect to login page
} catch (error) {
  console.error('Password update failed:', error.message);
}
```

## React Hook Integration

Use the provided custom hook for easy integration in React components:

```typescript
import { usePasswordResetTokens, updatePasswordWithService } from '@/lib/password-reset-integration-example';

function ResetPasswordComponent() {
  const { isValidToken, resetTokens, errorDetails } = usePasswordResetTokens();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (password: string) => {
    if (!resetTokens) return;
    
    setIsLoading(true);
    try {
      await updatePasswordWithService(resetTokens, password);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return <LoadingSpinner />;
  }

  if (isValidToken === false) {
    return <ErrorDisplay error={errorDetails} />;
  }

  return <PasswordResetForm onSubmit={handleSubmit} />;
}
```

## Error Handling

The service provides comprehensive error categorization:

### Token Validation Errors
- `missing_tokens`: No valid tokens found in URL
- `invalid_tokens`: Malformed or corrupted tokens
- `expired_tokens`: Tokens have expired
- `auth_error`: Authentication errors from Supabase

### Password Update Errors
- `weak`: Password doesn't meet strength requirements
- `same`: New password is same as current password
- `length`: Password is too short
- `rate_limit`: Too many attempts

### Example Error Handling

```typescript
try {
  await TokenValidationService.updatePasswordSecurely(tokens, password);
} catch (error) {
  // Error messages are already user-friendly
  toast.error(error.message);
  
  // For debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.error('Detailed error:', error);
  }
}
```

## Security Features

### Immediate Sign-Out
The service ensures users are signed out immediately after password updates to prevent unauthorized access:

```typescript
// This happens automatically in updatePasswordSecurely
await supabase.auth.updateUser({ password: newPassword });
await supabase.auth.signOut(); // Immediate sign-out for security
```

### No Persistent Sessions
Token validation doesn't create persistent sessions that could be exploited:

```typescript
// Validation only checks structure, not server-side validity
const validation = TokenValidationService.validateTokenStructure(tokens);
// No session created during validation
```

### Secure Token Handling
- Tokens are validated through Supabase's secure endpoints
- No sensitive information is logged in production
- Proper cleanup on errors

## TypeScript Interfaces

```typescript
interface ResetTokens {
  accessToken: string;
  refreshToken?: string;
  tokenHash?: string;
  type: 'standard' | 'hash';
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: 'missing_tokens' | 'invalid_tokens' | 'expired_tokens' | 'malformed_url' | 'auth_error';
  userMessage?: string;
}
```

## Testing

The service includes comprehensive unit and integration tests:

```bash
# Run unit tests
npm test -- __tests__/lib/token-validation-service.test.ts

# Run integration tests
npm test -- __tests__/integration/token-validation-service-integration.test.ts
```

## Migration from Existing Code

To migrate from the existing reset password implementation:

1. Replace token extraction logic with `TokenValidationService.extractTokensFromUrl()`
2. Replace validation logic with `TokenValidationService.validateTokensSecurely()`
3. Replace password update logic with `TokenValidationService.updatePasswordSecurely()`
4. Use the provided error categorization methods for consistent error handling

This centralized approach improves maintainability, security, and testability of the password reset flow.