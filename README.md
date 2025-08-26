# MIRYO - AI-Enhanced Telemedicine Platform

## Overview

MIRYO is a comprehensive telemedicine platform that combines the efficiency of modern communication interfaces with healthcare-specific features and AI-powered assistance. Built with React, TypeScript, and Tailwind CSS, it provides a secure, HIPAA-compliant environment for online medical consultations.

## Architecture

### System Context (C4 Model)

The platform follows a microservices architecture with the following key components:

- **Web/Mobile Clients**: React-based frontend with WebRTC support
- **Platform API**: Go/TypeScript backend with authentication and authorization
- **RTC Infrastructure**: WebRTC + SFU + TURN for low-latency communication
- **AI Services**: RAG/ASR/TTS/Orchestrator for intelligent assistance
- **External Integrations**: OIDC, FHIR, Payment gateways, Telephony

### Key Features

#### 🎥 **Enhanced Video Calling**
- WebRTC-based secure video/audio communication
- End-to-End Encryption (E2EE) with Insertable Streams
- Real-time quality monitoring with getStats() API
- Screen sharing for medical document review
- Connection quality indicators and statistics collection

#### 🤖 **AI-Powered Assistant**
- RAG (Retrieval-Augmented Generation) for evidence-based responses
- Medical triage and risk assessment
- Automatic escalation to human practitioners
- Citation-backed answers with confidence scoring
- HIPAA-compliant AI interactions

#### 📋 **Electronic Consent Management**
- eIDAS/Electronic Signature Law compliant
- Digital signature workflows (QES/AES/SES)
- Template-based consent forms
- Audit trails and tamper detection
- Multi-language support

#### 📊 **Comprehensive Healthcare Management**
- **Appointments**: Calendar integration, scheduling, reminders
- **Patient Records**: EHR management, document storage, version control
- **Medical Records**: Prescriptions, lab results, treatment plans
- **Emergency Alerts**: Priority-based triage, instant notifications
- **Settings**: Privacy controls, notification preferences, security settings

#### 🔒 **Security & Compliance**
- OIDC/OAuth2 authentication with WebAuthn/Passkeys
- SMART on FHIR integration for EHR interoperability
- PCI DSS compliant payment processing
- HIPAA/GDPR/APPI compliance measures
- Comprehensive audit logging

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Date-fns** for date manipulation
- **WebRTC APIs** for real-time communication

### Backend Architecture (Planned)
- **API Gateway**: Go/TypeScript with authentication/authorization
- **RTC Services**: LiveKit/mediasoup for SFU architecture
- **AI Services**: Python-based RAG, ASR, TTS services
- **Database**: PostgreSQL with pgvector for embeddings
- **Storage**: S3-compatible object storage

### Standards Compliance
- **FHIR R4**: Patient, Consent, Appointment, Encounter resources
- **SMART on FHIR**: Healthcare data interoperability
- **WebRTC**: DTLS-SRTP encryption, ICE/STUN/TURN protocols
- **OpenAPI 3.1**: Complete API specification
- **C4 Model**: Architecture documentation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd miryo-telemedicine
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Demo Features

The platform includes demo data and mock services to showcase functionality:

- **Role Switching**: Toggle between doctor and patient views
- **Mock Consultations**: Pre-populated chat rooms and appointments
- **AI Assistant**: Simulated RAG responses with citation support
- **Video Calls**: WebRTC simulation with quality monitoring
- **Consent Workflows**: Electronic signature simulation

## API Specification

The platform follows OpenAPI 3.1 specification with comprehensive endpoints for:

- **RTC Management**: Room creation, token generation, participant management
- **AI Services**: Chat completions, RAG queries, triage assessment
- **Consent Management**: Template management, signature workflows
- **FHIR Integration**: Patient data, appointments, encounters
- **Observability**: WebRTC statistics, audit events

## Security Considerations

### Authentication & Authorization
- OpenID Connect (OIDC) for identity management
- WebAuthn/Passkeys for multi-factor authentication
- Role-based access control (RBAC)
- Session management with configurable timeouts

### Data Protection
- End-to-end encryption for sensitive communications
- PCI DSS compliant payment processing (tokenization)
- HIPAA Security Rule implementation
- GDPR/APPI compliance measures

### Audit & Monitoring
- Comprehensive audit logging for all user actions
- WebRTC quality monitoring and statistics collection
- Real-time security event detection
- Tamper-evident consent records

## Development Guidelines

### Code Organization
- Modular component architecture
- TypeScript for type safety
- Consistent naming conventions
- Comprehensive error handling

### Testing Strategy
- Unit tests for critical components
- Integration tests for API endpoints
- E2E tests for user workflows
- Security testing for compliance

### Deployment
- Multi-region deployment support
- Container-based architecture
- Auto-scaling capabilities
- Disaster recovery planning

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Review the documentation

---

**MIRYO** - Transforming healthcare through AI-enhanced telemedicine technology.