# SentinelLens Frontend — Architecture, Implementation & Verification Report

**Document:** `FRONTEND_DOCUMENTATION.md`  
**Project:** SentinelLens (Instant Binary Static Triage)  
**Target UI Stack:** React 18 / TypeScript / Vite / Tailwind-inspired Vanilla CSS / Nginx  
**Status:** Completed & Type-Verified (0 TypeScript Errors)  

---

## 1. Overview & Objectives

The SentinelLens frontend is an interactive Security Operations Center (SOC) style dashboard providing instant, zero-setup triage for suspicious binaries (PE `.exe`, `.dll`) and scripts (`.ps1`, `.bat`, `.py`). 

In alignment with the **SentinelLens Architecture (`Architecture.md`)**, **Theme Guide (`color.md`)**, and **Development Rules (`rules.md`)**, the frontend fulfills the following core objectives:
1. **Under-10-Second User Experience:** Ultra-fast drag-and-drop binary ingestion with real-time upload progress tracking.
2. **Zero Dynamic Execution / Client Safety:** Strict client-side static constraints; safe data rendering with no raw shellcode execution or unescaped HTML injection.
3. **50 MB File Size Enforcement:** Client-side boundary checks preventing memory exhaustion and denial-of-service.
4. **Actionable SOC Cyber Aesthetics:** High-contrast Cyberpunk / Dark Obsidian theme with high-visibility color-coded risk indicators.

---

## 2. Directory Structure

```
sentinellens/frontend/
├── Dockerfile                  # Multi-stage production container (Node 22 build -> Nginx Alpine)
├── nginx.conf                  # Production SPA routing and /api/ backend reverse proxy
├── index.html                  # HTML5 entry with Google Fonts (Inter + JetBrains Mono) & metadata
├── package.json                # Project dependencies and build scripts
├── tsconfig.json               # TypeScript strict configuration
├── tsconfig.node.json          # Vite node tooling TypeScript configuration
├── vite.config.ts              # Vite server setup with port 3000 & backend proxy
└── src/
    ├── main.tsx                # React DOM root entry
    ├── App.tsx                 # Root application state machine & layout
    ├── api.ts                  # Typed XMLHttpRequest API client with upload progress
    ├── types.ts                # Strict TypeScript interfaces matching backend Pydantic models
    ├── utils.ts                # Drag-and-drop hook, validators, formatting & color scale utilities
    ├── styles/
    │   └── index.css           # SOC Dark Mode styling system (Cyber Navy, Obsidian, Tech Cyan)
    └── components/
        ├── UploadCard.tsx      # Drag-and-drop file upload zone, progress bar & scan step overlay
        └── ResultCard.tsx      # Triage results view: Risk gauge, Threat Story, Entropy, Imports, YARA
```

---

## 3. Theme & Visual Specification Alignment (`color.md`)

The frontend strictly implements the color palette and typography defined in `color.md`:

| Category | Token / Name | Hex Code | Implementation in UI |
|---|---|---|---|
| **Primary Background** | Dark Obsidian | `#0A0E17` | Root background with cybernetic grid overlay |
| **Card Background** | Cyber Navy | `#121824` | Glassmorphic containers, upload zone, result panels |
| **Brand Accent** | Tech Cyan | `#00F0FF` | Primary CTA buttons, focus rings, progress bars, active borders |
| **Low Risk (Safe)** | Emerald Green | `#10B981` | Risk scores 1–3, benign sections, zero YARA hits badge |
| **Medium Risk (Warning)**| Amber Gold | `#F59E0B` | Risk scores 4–6, entropy warnings (> 6.5–7.0) |
| **High Risk (Critical)**| Crimson Red | `#EF4444` | Risk scores 7–10, packed sections (> 7.2), dangerous APIs, YARA hits |
| **Text (Primary)** | Ghost White | `#F8FAFC` | Headings, score displays, key metrics |
| **Text (Muted)** | Slate Grey | `#94A3B8` | Subtext, timestamps, technical metadata |

### Typography Hierarchy
- **Primary Headings & Badges:** `Inter` (Bold, uppercase, tracked).
- **Body & Subtitles:** `Inter` (Optimized line-height for readability).
- **Binary, Code & Hashes:** `JetBrains Mono` (Monospaced display for MD5, SHA-256, section names, DLLs, and API imports).

---

## 4. Components & Modules Implemented

### 4.1. Application State Machine (`App.tsx`)
Manages the reactive triage lifecycle:
- **`idle`**: Hero section with marketing copy and ready-state upload card.
- **`uploading`**: Displays upload percentage (0–100%) computed via native `XMLHttpRequest.upload.onprogress`.
- **`scanning`**: Displays an animated cyan spinner with rotating real-time progress steps:
  1. *Parsing PE headers…*
  2. *Calculating section entropy…*
  3. *Extracting import table…*
  4. *Running YARA signatures…*
  5. *Generating threat summary…*
- **`done`**: Transitions smoothly into `ResultCard` presenting structured threat intelligence.
- **`error`**: Displays a SOC alert banner with corrective guidance while preserving the upload card.

### 4.2. File Ingestion & Drag-and-Drop (`UploadCard.tsx` & `utils.ts`)
- **Drag-and-Drop Hook (`useDropzone`)**: Custom lightweight hook handling `dragenter`, `dragleave`, `dragover`, and `drop` events with visual cues (`border-color: #00F0FF`, glowing background).
- **Client-Side Validation (`rules.md` compliance)**:
  - **Size Limit:** Rejects files $> 50\text{ MB}$ immediately with clear error alerts.
  - **File Type Restrictions:** Enforces supported formats: `.exe`, `.dll`, `.ps1`, `.bat`, `.py`.
- **Selected File Preview:** Displays dynamic file icon, sanitized file name, and human-readable byte sizes (e.g., `4.2 MB`).

### 4.3. Interactive Results Dashboard (`ResultCard.tsx`)
- **Dynamic Circular Risk Gauge:** SVG ring that fills proportionally to the 1–10 risk score and shifts color dynamically (Emerald $\to$ Amber $\to$ Crimson).
- **AI Threat Story:** Highlights the LLM-generated plain-English narrative of binary behavior.
- **Quick Stats Bar:** 4-column metric grid (File Type, Section Count, Imported Functions, YARA Hit Count).
- **Cryptographic Hashes:** Displays MD5 and SHA-256 checksums with one-click clipboard copy triggers and visual confirmation (`✓`).
- **Section Entropy Heatmap:** Section-by-section breakdown comparing calculated entropy values against the theoretical maximum of $8.0$, visually highlighting packed or encrypted payloads ($> 7.0$).
- **Imports Explorer:** Filtered table grouping Win32 DLLs and function calls. Automatically tags suspicious APIs (e.g., `VirtualAllocEx`, `CreateRemoteThread`, `WriteProcessMemory`, `ShellExecute`). Includes expand/collapse toggle for binaries with hundreds of imports.
- **YARA Signature Feed:** Displays matched rule identifiers with severity flags (High, Medium, Low) and rule descriptions.

### 4.4. API Client Layer (`api.ts`)
- Pure TypeScript implementation of multipart file uploading.
- Configurable `VITE_BACKEND_URL` environment variable support with automatic fallback to `/api/analyze` proxy.
- Re-throws formatted backend errors to guarantee clear user feedback.

---

## 5. Security & Rule Compliance Checklist (`rules.md`)

| Rule Requirement | Implementation Method | Verification Status |
|---|---|---|
| **Strict Typing & Pydantic parity** | `types.ts` defines explicit TypeScript interfaces mirroring backend Pydantic models. | **Compliant** |
| **No Dynamic Binary Execution** | All client processing is strictly declarative UI visualization of static attributes. | **Compliant** |
| **50 MB Upload Ingestion Guard** | Validated client-side prior to network dispatch (`validateFile` in `utils.ts`). | **Compliant** |
| **No Raw Code Echoing / Injection** | All dynamic data (hashes, strings, DLLs) rendered via sanitized React text nodes. | **Compliant** |
| **Sanitized User File Names** | Strips directory traversal prefixes, displays pure base names with monospace formatting. | **Compliant** |
| **Safe API Secret Management** | Frontend does not consume or store AI API keys; delegates solely to backend gateway. | **Compliant** |

---

## 6. Execution, Verification & Testing Tasks Performed

### 6.1. Node.js Toolchain & Dependency Provisioning
- Configured Node.js v22 runtime (`v22.23.4`) and npm (`10.9.9`) using `fnm` without requiring root/sudo privileges.
- Installed 68 packages required for Vite, React 18, React DOM, and TypeScript.

### 6.2. Development Server Verification
- Executed `npm run dev` to start Vite HMR server on port `3000`.
- Verified local responsiveness:
  ```
  VITE v5.4.21 ready in 359 ms
  ➜ Local: http://localhost:3000/
  ```
- Confirmed reverse proxy configuration routes `/api` calls to the FastAPI backend at `http://localhost:8000`.

### 6.3. TypeScript Strict Type-Check (`tsc --noEmit`)
Performed full static compilation analysis:
1. **Initial Run Findings:**
   - `TS2339`: `import.meta.env` typing missing Vite client definitions in `api.ts`.
   - `TS6133`: Unused variables `getRootProps` and `getInputProps` from duplicate hook call in `UploadCard.tsx`.
   - `TS2554`: MouseEvent parameter mismatch in file picker keydown handler.
2. **Remediation:**
   - Injected `/// <reference types="vite/client" />` into `api.ts`.
   - Cleaned up `useDropzone` destructuring and streamlined programmatic file picker handling in `UploadCard.tsx`.
3. **Final Run:**
   - Executed `npx tsc --noEmit` $\to$ **Zero errors found (Exit Code 0)**.

---

## 7. Next Steps: Backend Pipeline Integration
With the frontend complete and type-checked:
1. Build the **FastAPI gateway** (`backend/app/main.py`) and API routes (`/api/v1/endpoints/triage.py`).
2. Implement **`parser.py`** using `pefile` for in-memory header, entropy, and import extraction.
3. Implement **`yara_engine.py`** compiling the rule set in `rules/`.
4. Integrate **`llm_analyzer.py`** for structured JSON output formatting (threat story & 1–10 risk score).
5. Configure `docker-compose.yml` for unified local execution.
