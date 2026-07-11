# Blazorapp_practise_backups

This repository serves as a centralized backup system for my active development files, allowing me to sync, download, and maintain code continuity.

---

## PC Path:** `F:\Aviyaan\Aviyaan_backups` *(Recommended to keep paths identical to prevent broken relative file links)*

### Project Stack
*   **IDE:** Microsoft Visual Studio
*   **Primary Framework:** Blazor / .NET Core 
*   **Main Application:** HighResolutionMap (Solution View: `HighResolutionMap.slnx`)

---

## 🔄 Daily Workflow (Syncing Instructions)

To avoid code conflicts when moving between computers, always follow these quick steps:

### 1. Before Starting Work (Pull Latest)
Always download the latest updates you made from your other computer before writing new code.
* Open the project in Visual Studio.
* Go to **Git Changes** -> Click the **Fetch / Pull** icon (downward arrow) to grab the latest changes from GitHub.

### 2. After Finishing Work (Push Updates)
Always upload your work at the end of the day so it is ready for your other computer.
* Open **Git Changes** in Visual Studio.
* Type a short message (e.g., `"Updated map layout from work pc"`).
* Click **Commit All**.
* Click the **Push** icon (upward arrow) to send it to GitHub.

---

## 🚫 Exclusion Rules (.gitignore)
This repository is configured to ignore heavy, temporary build folders like `bin/`, `obj/`, and `.vs/`. Only actual source code, components, and configuration files are synced to keep downloads fast and lightweight.
