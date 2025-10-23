import { parseResumeText } from './services/geminiService';

// Test resume parsing with the uploaded resume
async function testResumeParsing() {
    console.log('='.repeat(80));
    console.log('RESUME PARSING DEBUG TEST');
    console.log('='.repeat(80));
    
    const resumeText = `Roberto do Carmo Filho
Email: carmodovopscloud@gmail.com | LinkedIn: linkedin.com/in/robertocarm | Location: Remote (LATAM)

Professional Summary
AWS-Centric Cloud & DevOps Architect with 10+ years of experience designing, implementing, and optimizing scalable, secure, and resilient cloud infrastructure (AWS (3X) and CKAD certified, with deep expertise in Kubernetes, AWS EKS, ArgoCD, and Terraform.

Professional Experience
Cloud Architect / DevOps Engineer
Turing Inc | Dec 2022 - Present | Remote
* EKS Architecture: Designed and managed Amazon EKS clusters using Terraform.

Education
Master's in Computing Engineering (IT Security)
Escola Politécnica da USP | 2003 - 2006

Certifications
AWS Certified DevOps Engineer - Professional
CKAD: Certified Kubernetes Application Developer

Skills
AWS, Kubernetes, Terraform, Python`;

    console.log('\nTesting with shorter resume text...\n');
    
    try {
        const result = await parseResumeText(resumeText);
        
        console.log('✓ Parsing successful!\n');
        console.log('Raw result structure:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ TEST COMPLETED');
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

// Run the test
testResumeParsing().catch(console.error);
