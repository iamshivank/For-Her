# Security Policy

## Overview

CycleWise takes security and privacy seriously. This document outlines our security practices, how to report vulnerabilities, and the measures we take to protect user data.

## Security Architecture

### Local-First Design
- **No Backend Servers**: All data is stored locally in the user's browser
- **No Data Transmission**: Personal health data never leaves the user's device
- **Offline Capable**: Full functionality without internet connection
- **No Accounts**: No user accounts, authentication, or personal identifiers

### Encryption

#### Client-Side Encryption
- **Algorithm**: AES-GCM (256-bit keys)
- **Key Derivation**: PBKDF2 with SHA-256 (100,000 iterations)
- **Random Values**: Cryptographically secure random number generation
- **Initialization Vectors**: Unique IV for each encryption operation
- **Salt**: Random salt for each key derivation

#### Implementation Details
```typescript
// Key derivation parameters
const ITERATIONS = 100000;    // PBKDF2 iterations
const KEY_LENGTH = 256;       // AES key length in bits
const IV_LENGTH = 12;         // GCM IV length in bytes
const SALT_LENGTH = 16;       // Salt length in bytes
const TAG_LENGTH = 16;        // GCM tag length in bytes
```

#### Encrypted Data Tables
The following data types are encrypted at rest:
- Period logs
- Symptom logs
- Mood logs
- Breathing session data
- Health profile information

#### Non-Encrypted Data
- User preferences (theme, language, notifications)
- Predictions and insights (derived from encrypted data)
- App settings and configuration

### Web Crypto API
- Uses browser's native WebCrypto API
- Requires secure context (HTTPS)
- Hardware-backed cryptography when available
- Constant-time operations to prevent timing attacks

## Security Headers

### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self';
```

### Additional Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Data Protection

### Data Storage
- **IndexedDB**: Browser's native database with encryption layer
- **Local Storage**: Only for non-sensitive app preferences
- **Session Storage**: Temporary data, cleared on app close
- **No Cookies**: No tracking or session cookies used

### Data Isolation
- **Origin Isolation**: Data isolated by browser origin
- **User Isolation**: Each browser profile maintains separate data
- **Device Isolation**: Data doesn't sync between devices by default

### Data Lifecycle
1. **Creation**: Data encrypted before storage
2. **Access**: Decrypted only when needed, in memory
3. **Modification**: Re-encrypted with new random values
4. **Deletion**: Cryptographic deletion by key destruction

## Privacy Measures

### Anonymous by Default
- No user accounts or registration
- No personal identifiers collected
- No tracking pixels or analytics by default
- No third-party integrations without consent

### Data Minimization
- Only collect data necessary for app functionality
- Optional data fields clearly marked
- User controls over data retention
- Regular data cleanup of temporary files

### Discreet Mode
- Neutral app appearance
- Generic app name and icons
- Content obfuscation options
- Optional passcode protection

## Vulnerability Reporting

### Responsible Disclosure
We encourage responsible disclosure of security vulnerabilities. Please follow these guidelines:

1. **Do not** publicly disclose the vulnerability before we have had a chance to address it
2. **Do not** access, modify, or delete user data during testing
3. **Do not** perform any actions that could harm users or the service

### How to Report
- **Email**: security@cyclewise.app
- **PGP Key**: [Available on our website]
- **Response Time**: We aim to respond within 24 hours
- **Updates**: Regular updates on investigation progress

### What to Include
- Detailed description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested remediation (if any)
- Your contact information for follow-up

### Bug Bounty
Currently, we do not offer a formal bug bounty program, but we recognize and appreciate security researchers who help improve our security posture.

## Security Testing

### Automated Testing
- Static Application Security Testing (SAST)
- Dependency vulnerability scanning
- Automated security linting
- Regular security audits of dependencies

### Manual Testing
- Code review for security issues
- Penetration testing of critical components
- Cryptographic implementation review
- Privacy impact assessments

### Third-Party Audits
We plan to conduct regular third-party security audits and will publish summaries of findings and remediation efforts.

## Incident Response

### Detection
- Automated monitoring for security issues
- User reports of suspicious activity
- Security researcher disclosures
- Internal security reviews

### Response Process
1. **Assessment**: Evaluate the severity and impact
2. **Containment**: Implement immediate protective measures
3. **Investigation**: Determine root cause and scope
4. **Remediation**: Develop and deploy fixes
5. **Communication**: Notify affected users if necessary
6. **Review**: Post-incident analysis and improvements

### Communication
- Security advisories for critical issues
- Release notes for security updates
- Transparency reports (annual)

## Compliance

### Standards Adherence
- OWASP Top 10 Web Application Security Risks
- NIST Cybersecurity Framework
- ISO 27001 principles
- GDPR privacy principles (where applicable)

### Regular Reviews
- Quarterly security reviews
- Annual penetration testing
- Continuous dependency monitoring
- Regular threat modeling updates

## User Security Best Practices

### Strong Passphrases
- Use a unique, strong passphrase for encryption
- Minimum 12 characters with mixed case, numbers, symbols
- Consider using a passphrase generator
- Store your passphrase securely (password manager)

### Device Security
- Keep your device and browser updated
- Use device lock screens and encryption
- Be cautious of public Wi-Fi networks
- Regularly clear browser data if shared device

### Backup and Recovery
- Export your data regularly as backup
- Store encrypted backups securely
- Test data import/export functionality
- Have a recovery plan if you forget your passphrase

### Warning Signs
Report these issues immediately:
- Unexpected data loss or corruption
- App behavior changes after updates
- Suspicious network activity
- Error messages mentioning security

## Security Updates

### Update Policy
- Critical security updates: Immediate release
- High priority updates: Within 48 hours
- Medium priority updates: Next scheduled release
- Low priority updates: Quarterly releases

### Notification Methods
- In-app notifications for critical updates
- Email alerts (if subscribed)
- Security advisories on website
- GitHub security advisories

## Contact Information

### Security Team
- **Email**: security@cyclewise.app
- **Response Time**: 24 hours for initial response
- **Languages**: English, Spanish

### General Support
- **Email**: support@cyclewise.app
- **GitHub**: [Issues page]
- **Community**: [GitHub Discussions]

## Acknowledgments

We thank the security research community for their contributions to making CycleWise more secure. Special recognition to:

- [Security researchers who have contributed]
- [Bug bounty participants]
- [Community members who reported issues]

---

**Last Updated**: [Date]
**Version**: 1.0
**Next Review**: [Date + 6 months]
