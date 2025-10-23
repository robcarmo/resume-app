import { parseResumeText } from './services/geminiService';

async function testFullResume() {
    console.log('='.repeat(80));
    console.log('FULL RESUME PARSING TEST');
    console.log('='.repeat(80));
    
    const resumeText = `Roberto do Carmo Filho
Email: carmodovopscloud@gmail.com | LinkedIn: linkedin.com/in/robertocarm | Location: Remote (LATAM)

Professional Summary
AWS-Centric Cloud & DevOps Architect with 10+ years of experience designing, implementing, and optimizing scalable, secure, and resilient cloud infrastructure (AWS (3X) and CKAD certified, with deep expertise in Kubernetes, AWS EKS, ArgoCD, and Terraform. Proven track record in automating software delivery, enhancing security, and optimizing system performance for global enterprises. Adept at collaborating with cross-functional teams to drive operational excellence, scalability, and compliance with industry standards (GDPR, SOC 2).

Professional Experience
Cloud Architect / DevOps Engineer
Turing Inc | Dec 2022 - Present | Remote
* EKS Architecture: Designed and managed Amazon EKS clusters using Terraform with full GitOps automation via ArgoCD, enabling self-service deployment models and blue-green staged rollouts.
* CI/CD Standardization: Standardized workflows by integrating GitHub Actions with ArgoCD ApplicationSets and Kustomize, supporting multi-environment deployments across ML and microservices workloads.
* Security & Network Segmentation: Implemented fine-grained access control and network segmentation using IAM, VPC CNI, and Calico with Pod Security Standards and NetworkPolicies.
* MLOps Integration: Collaborated with MLOps teams to support real-time inference workloads on EKS, integrating SageMaker endpoints and custom container deployments via GitOps pipelines.
* Automation & Tooling: Developed internal Python tooling for automated log parsing, resource health checks, custom ArgoCD notifications, and deployment monitoring.
Key Tech: AWS EKS, ArgoCD, Terraform, GitHub Actions, SageMaker, Python, Calico, VPC CNI, Prometheus

Cloud Platform Engineer
Upwork Inc | Apr 2021 - Dec 2022 | Remote
* GitOps Migration: Migrated traditional CI/CD workflows to ArgoCD-managed GitOps, supporting continuous deployment for.NET and Spring Boot applications on Amazon EKS with automated sync policies.
* ArgoCD Patterns: Defined ArgoCD App-of-Apps patterns and sync hooks for complex service orchestration, implementing progressive delivery with environment parity and release governance.
* Service Mesh Integration: Deployed and managed EKS clusters with Terraform and Helm, integrating Istio for advanced traffic management, canary rollouts, and observability.
* Development Tooling: Created Python-based CLI tools for generating ArgoCD manifests, parsing deployment logs, and providing pipeline observability with custom dashboards.
* Monitoring & Observability: Implemented comprehensive Prometheus and Grafana dashboards to monitor application health, deployment lag, cluster performance, and service mesh metrics.
Key Tech: AWS EKS, ArgoCD, Terraform, GitHub Actions, Istio, Python, Prometheus, Helm

DevOps Engineer / Cloud Architect
IBM | Aug 2016 - Apr 2021 | Hybrid
* AWS Infrastructure Design: Designed and managed enterprise-grade AWS infrastructure leveraging EC2, RDS, DynamoDB, and Lambda with auto-scaling, multi-AZ deployments, and cost optimization strategies.
* Enterprise CI/CD: Implemented comprehensive CI/CD pipelines with Jenkins and GitHub Actions, automating build, test, and deployment processes for.NET and Java microservices on AWS EKS.
* Disaster Recovery Architecture: Architected disaster recovery solutions using AWS Site Recovery, S3 cross-region replication, and Route 53 with RTO under 15 minutes and automated failover mechanisms.
* Infrastructure as Code: Automated infrastructure provisioning with Terraform and CloudFormation, managing VPCs, security groups, and IAM roles with compliance and security best practices.
* Kubernetes Orchestration: Managed production Kubernetes (EKS) clusters, integrating microservices with AWS services, implementing HPA/VPA autoscaling, and optimizing resource utilization.
Key Tech: AWS EKS, EC2, RDS, S3, Terraform, Jenkins, CloudWatch, Python

Education
Master's in Computing Engineering (IT Security)
Escola Politécnica da USP | 2003 - 2006
Bachelor's in Mechatronics, Robotics, and Automation Engineering
Universidade Paulista | 1994 - 2000

Certifications
AWS Certified DevOps Engineer - Professional
AWS Certified Solutions Architect - Associate
AWS Certified Cloud Practitioner
CKAD: Certified Kubernetes Application Developer
Google Cloud Certified Professional Cloud Architect
Google Cloud Certified Cloud Engineer
PMI Agile Certified Practitioner (PMI-ACP)

Core Technical Skills & Expertise

Cloud Platforms
* AWS (12+ years): EKS, EC2, RDS, DynamoDB, CloudWatch, Lambda, S3, VPC
* GCP (6+ years): GKE, Cloud Functions, BigQuery, Cloud Storage
* Azure (6+ years): AKS, Functions, SQL Database, Storage

Container & Orchestration
* Kubernetes (8+ years): EKS, GKE, AKS, RBAC, NetworkPolicies
* Docker (8+ years): Multi-stage builds, registry management
* Container Platforms: Rancher, OpenShift

Infrastructure as Code
* Terraform (6+ years): Multi-cloud modules, state management
* CloudFormation (4+ years): AWS native templates, StackSets
* Configuration Management: Ansible, Chef

GitOps & CI/CD
* ArgoCD (3+ years): App-of-Apps, ApplicationSets, sync hooks
* GitHub Actions (4+ years): Workflow automation, self-hosted runners
* Jenkins (2+ years): Pipeline as Code, Blue Ocean
* GitLab CI (6+ years): Multi-project pipelines

Service Mesh & Networking
* Istio (3+ years): Traffic management, security policies
* VPC CNI (5+ years): Pod networking, security groups
* Calico (4+ years): NetworkPolicies, BGP routing
* Load Balancing: ALB, NLB, ingress controllers

Monitoring & Observability
* Prometheus (4+ years): Custom metrics, alerting rules
* Grafana (4+ years): Dashboard design, data sources
* CloudWatch (6+ years): Custom metrics, log insights
* ELK Stack (3+ years): Log aggregation, analysis

Security & Compliance
* AWS IAM (12+ years): Fine-grained permissions, roles
* Security Scanning (4+ years): Snyk, AWS Security Hub
* Encryption (8+ years): KMS, TLS, at-rest encryption
* Compliance (5+ years): GDPR, SOC 2, CIS benchmarks

Programming & Automation
* Python (5+ years): Automation, CLI tools, data processing
* Bash (8+ years): System administration, deployment scripts
* YAML/JSON (10+ years): Configuration management
* Go (2+ years): Microservices, CLI tools`;

    console.log(`\nResume length: ${resumeText.length} characters\n`);
    console.log('Parsing...\n');
    
    try {
        const startTime = Date.now();
        const result = await parseResumeText(resumeText);
        const duration = Date.now() - startTime;
        
        console.log(`✓ Parsing successful! (${duration}ms)\n`);
        
        // Safe access to properties
        console.log('Summary of parsed data:');
        console.log(`  Name: ${result.personalInfo?.name || 'N/A'}`);
        console.log(`  Email: ${result.personalInfo?.email || 'N/A'}`);
        console.log(`  Phone: ${result.personalInfo?.phone || 'N/A'}`);
        console.log(`  Location: ${result.personalInfo?.location || 'N/A'}`);
        console.log(`  Summary: ${result.personalInfo?.summary ? result.personalInfo.summary.substring(0, 80) + '...' : 'N/A'}`);
        console.log(`  Experience items: ${result.experience?.length || 0}`);
        console.log(`  Education items: ${result.education?.length || 0}`);
        console.log(`  Certifications: ${result.certifications?.length || 0}`);
        console.log(`  Skills: ${result.skills?.length || 0}`);
        console.log(`  Projects: ${result.projects?.length || 0}`);
        console.log(`  Key Architectural Projects: ${result.keyArchitecturalProjects?.length || 0}`);
        
        console.log('\n\nFull JSON output:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ TEST COMPLETED SUCCESSFULLY');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('\n✗ Parsing failed!');
        console.error('Error:', error instanceof Error ? error.message : String(error));
        
        if (error instanceof Error && error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('❌ TEST FAILED');
        console.log('='.repeat(80));
        process.exit(1);
    }
}

testFullResume().catch(console.error);
