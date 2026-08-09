import os

def replace_in_file(path, search_dict):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for search, replace in search_dict.items():
        if search in content:
            content = content.replace(search, replace)
            print(f'Replaced in {os.path.basename(path)}')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# File 1: Final_IEEE_Research_Paper.md
f1 = 'd:/FinalProj/docs/Final_IEEE_Research_Paper.md'
s1 = 'fraud detection. The system employs'
r1 = 'fraud detection.\n\nThe system employs'
s1b = 'scenarios. Our methodology'
r1b = 'scenarios.\n\nOur methodology'
replace_in_file(f1, {s1: r1, s1b: r1b})

# File 2: IEEE_Paper_Format_v2.md
f2 = 'd:/FinalProj/docs/IEEE_Paper_Format_v2.md'
s2 = 'face recognition. Furthermore, it employs'
r2 = 'face recognition.\n\nFurthermore, it employs'
s2b = 'environments. We demonstrate'
r2b = 'environments.\n\nWe demonstrate'
replace_in_file(f2, {s2: r2, s2b: r2b})

# File 3: IEEE_Paper_Draft.md
f3 = 'd:/FinalProj/docs/IEEE_Paper_Draft.md'
s3 = 'coercion. This paper proposes'
r3 = 'coercion.\n\nThis paper proposes'
s3b = 'environments. We demonstrate'
r3b = 'environments.\n\nWe demonstrate'
replace_in_file(f3, {s3: r3, s3b: r3b})

# File 4: generate_full_report.js
f4 = 'd:/FinalProj/docs/scripts/generate_full_report.js'

s4 = """bodyPara("Modern electronic voting systems remain vulnerable to centralized database manipulation, identity spoofing, and voter coercion due to monolithic server design and absence of cryptographic auditability. This paper proposes a decentralized e-voting system based on the Ethereum blockchain that integrates three security layers: client-side RSA-2048 ballot encryption with decentralized key management via Shamir's Secret Sharing scheme; a three-factor authentication protocol combining blockchain wallet ownership, one-time password verification, and CNN-based biometric face recognition; and computer vision-based real-time anti-coercion monitoring. The system achieved 92.1% precision in face recognition, 96.0% precision in anti-spoofing, and 95.7% precision with 98.0% accuracy in coercion detection."),"""

r4 = """bodyPara("Modern electronic voting systems remain vulnerable to centralized database manipulation, identity spoofing, and voter coercion due to monolithic server design and absence of cryptographic auditability. This paper proposes a decentralized e-voting system based on the Ethereum blockchain that integrates three security layers: client-side RSA-2048 ballot encryption with decentralized key management via Shamir's Secret Sharing scheme; a three-factor authentication protocol combining blockchain wallet ownership, one-time password verification, and CNN-based biometric face recognition; and computer vision-based real-time anti-coercion monitoring."),
  bodyPara("The system was implemented as a multi-service decentralized application (DApp) comprising a React.js/Next.js frontend with client-side AI processing, a Node.js/Express backend for voter management, a Python/FastAPI server for face verification, an OTP service for dual-channel verification, and Ethereum smart contracts written in Solidity for on-chain logic."),
  bodyPara("The system achieved 92.1% precision in face recognition, 96.0% precision in anti-spoofing, and 95.7% precision with 98.0% accuracy in coercion detection when tested using the Labeled Faces in the Wild benchmark, the CelebA-Spoof dataset, and 130 controlled video recordings."),"""

replace_in_file(f4, {s4: r4})
print('All replacements done.')
