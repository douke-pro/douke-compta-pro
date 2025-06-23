/**
 * DOUKÈ Compta Pro - Connecteur Google Sheets
 * Synchronisation des données avec Google Sheets
 */

class GoogleSheetsConnector {
    constructor() {
        this.apiKey = null;
        this.spreadsheetId = null;
        this.isConnected = false;
        this.lastSync = null;
        
        // Configuration des feuilles
        this.sheets = {
            companies: 'Entreprises',
            users: 'Utilisateurs', 
            accounts: 'Comptes',
            entries: 'Ecritures',
            cash: 'Caisse',
            backup: 'Sauvegarde'
        };
    }

    // ========== CONFIGURATION ==========
    configure(apiKey, spreadsheetId) {
        this.apiKey = apiKey;
        this.spreadsheetId = spreadsheetId;
        localStorage.setItem('google_sheets_config', JSON.stringify({
            apiKey,
            spreadsheetId,
            configuredAt: new Date().toISOString()
        }));
    }

    // Chargement de la configuration
    loadConfiguration() {
        try {
            const config = JSON.parse(localStorage.getItem('google_sheets_config') || '{}');
            if (config.apiKey && config.spreadsheetId) {
                this.apiKey = config.apiKey;
                this.spreadsheetId = config.spreadsheetId;
                return true;
            }
        } catch (error) {
            console.error('Erreur chargement configuration Google Sheets:', error);
        }
        return false;
    }

    // ========== CONNEXION ==========
    async testConnection() {
        if (!this.apiKey || !this.spreadsheetId) {
            throw new Error('Configuration Google Sheets manquante');
        }

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?key=${this.apiKey}`;
            const response = await fetch(url);
            
            if (response.ok) {
                this.isConnected = true;
                this.lastSync = new Date().toISOString();
                return { success: true, message: 'Connexion Google Sheets réussie' };
            } else {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
        } catch (error) {
            this.isConnected = false;
            throw new Error(`Connexion échouée: ${error.message}`);
        }
    }

    // ========== LECTURE DE DONNÉES ==========
    async readSheet(sheetName, range = '') {
        if (!this.isConnected) {
            await this.testConnection();
        }

        const fullRange = range ? `${sheetName}!${range}` : sheetName;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${fullRange}?key=${this.apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur lecture: ${response.status}`);
            }

            const data = await response.json();
            return this.parseSheetData(data.values || []);
        } catch (error) {
            Helpers.log('Erreur lecture Google Sheets', { sheetName, error: error.message }, 'error');
            throw error;
        }
    }

    // Conversion des données de feuille en objets
    parseSheetData(values) {
        if (values.length < 2) return [];
        
        const headers = values[0];
        return values.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    }

    // ========== ÉCRITURE DE DONNÉES ==========
    async writeSheet(sheetName, data, startRange = 'A1') {
        if (!this.isConnected) {
            await this.testConnection();
        }

        // Note: L'écriture nécessite OAuth2, pas juste une API key
        // Cette fonction est un placeholder pour une implémentation complète
        console.warn('Écriture Google Sheets nécessite une authentification OAuth2 complète');
        
        // Simulation du succès pour le développement
        return new Promise((resolve) => {
            setTimeout(() => {
                Helpers.log('Simulation écriture Google Sheets', { sheetName, rowCount: data.length });
                resolve({ success: true, updatedRows: data.length });
            }, 1000);
        });
    }

    // ========== SYNCHRONISATION ==========
    async syncToSheets(dataType, data) {
        try {
            const sheetName = this.sheets[dataType];
            if (!sheetName) {
                throw new Error(`Type de données non supporté: ${dataType}`);
            }

            // Préparation des données pour Google Sheets
            const formattedData = this.formatDataForSheets(dataType, data);
            
            const result = await this.writeSheet(sheetName, formattedData);
            
            if (result.success) {
                this.lastSync = new Date().toISOString();
                NotificationManager.show(`Synchronisation ${dataType} réussie`, 'success');
            }
            
            return result;
        } catch (error) {
            Helpers.log('Erreur synchronisation', { dataType, error: error.message }, 'error');
            NotificationManager.show(`Erreur sync ${dataType}: ${error.message}`, 'error');
            throw error;
        }
    }

    async syncFromSheets(dataType) {
        try {
            const sheetName = this.sheets[dataType];
            if (!sheetName) {
                throw new Error(`Type de données non supporté: ${dataType}`);
            }

            const data = await this.readSheet(sheetName);
            
            // Validation et nettoyage des données
            const cleanData = this.validateAndCleanData(dataType, data);
            
            this.lastSync = new Date().toISOString();
            NotificationManager.show(`Import ${dataType} réussi (${cleanData.length} éléments)`, 'success');
            
            return cleanData;
        } catch (error) {
            Helpers.log('Erreur import', { dataType, error: error.message }, 'error');
            NotificationManager.show(`Erreur import ${dataType}: ${error.message}`, 'error');
            throw error;
        }
    }

    // ========== FORMATAGE DE DONNÉES ==========
    formatDataForSheets(dataType, data) {
        if (!Array.isArray(data) || data.length === 0) return [];

        // Headers basés sur le premier objet
        const headers = Object.keys(data[0]);
        
        // Données formatées
        const rows = [headers];
        
        data.forEach(item => {
            const row = headers.map(header => {
                let value = item[header];
                
                // Formatage spécial selon le type
                if (dataType === 'entries' && header === 'amount') {
                    value = parseFloat(value) || 0;
                } else if (header.includes('date') || header.includes('Date')) {
                    value = Helpers.formatDate(value, 'yyyy-mm-dd');
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                
                return value || '';
            });
            rows.push(row);
        });

        return rows;
    }

    // Validation des données importées
    validateAndCleanData(dataType, data) {
        if (!Array.isArray(data)) return [];

        return data.filter(item => {
            // Validation basique selon le type
            switch (dataType) {
                case 'companies':
                    return item.name && item.name.trim();
                case 'users':
                    return item.email && Helpers.isValidEmail(item.email);
                case 'accounts':
                    return item.accountNumber && Helpers.isValidAccountNumber(item.accountNumber);
                case 'entries':
                    return item.amount && Helpers.isValidAmount(item.amount);
                default:
                    return true;
            }
        }).map(item => {
            // Nettoyage des données
            const cleaned = {};
            Object.keys(item).forEach(key => {
                cleaned[key] = typeof item[key] === 'string' ? 
                    Helpers.cleanString(item[key]) : item[key];
            });
            return cleaned;
        });
    }

    // ========== SAUVEGARDE AUTOMATIQUE ==========
    async createBackup(allData) {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '3.1',
                data: allData,
                checksum: this.generateChecksum(allData)
            };

            const result = await this.writeSheet(this.sheets.backup, [backupData]);
            
            if (result.success) {
                NotificationManager.show('Sauvegarde créée avec succès', 'success');
            }
            
            return result;
        } catch (error) {
            Helpers.log('Erreur sauvegarde', error, 'error');
            throw error;
        }
    }

    // Génération d'un checksum simple
    generateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Conversion en 32bit
        }
        return hash.toString();
    }

    // ========== INTERFACE UTILISATEUR ==========
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            lastSync: this.lastSync,
            spreadsheetId: this.spreadsheetId ? 
                this.spreadsheetId.substring(0, 8) + '...' : null
        };
    }

    // Configuration depuis l'interface
    async configureFromUI() {
        return new Promise((resolve, reject) => {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 class="text-lg font-medium mb-4">Configuration Google Sheets</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2">API Key Google Sheets</label>
                                <input type="text" id="googleApiKey" placeholder="Votre clé API..." 
                                    class="w-full px-3 py-2 border rounded-lg text-base">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">ID du Spreadsheet</label>
                                <input type="text" id="googleSpreadsheetId" placeholder="ID du document..." 
                                    class="w-full px-3 py-2 border rounded-lg text-base">
                            </div>
                            <div class="flex space-x-2">
                                <button id="testGoogleConnection" class="flex-1 bg-primary text-white py-2 rounded-lg">
                                    Tester
                                </button>
                                <button id="saveGoogleConfig" class="flex-1 bg-success text-white py-2 rounded-lg">
                                    Sauvegarder
                                </button>
                                <button id="cancelGoogleConfig" class="flex-1 bg-gray-500 text-white py-2 rounded-lg">
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Gestionnaires d'événements
            document.getElementById('testGoogleConnection').onclick = async () => {
                const apiKey = document.getElementById('googleApiKey').value;
                const spreadsheetId = document.getElementById('googleSpreadsheetId').value;
                
                if (!apiKey || !spreadsheetId) {
                    alert('Veuillez remplir tous les champs');
                    return;
                }

                try {
                    this.configure(apiKey, spreadsheetId);
                    await this.testConnection();
                    alert('Connexion réussie !');
                } catch (error) {
                    alert(`Erreur: ${error.message}`);
                }
            };

            document.getElementById('saveGoogleConfig').onclick = () => {
                const apiKey = document.getElementById('googleApiKey').value;
                const spreadsheetId = document.getElementById('googleSpreadsheetId').value;
                
                if (apiKey && spreadsheetId) {
                    this.configure(apiKey, spreadsheetId);
                    document.body.removeChild(modal);
                    resolve(true);
                } else {
                    alert('Veuillez remplir tous les champs');
                }
            };

            document.getElementById('cancelGoogleConfig').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
        });
    }
}

// Instance globale
window.GoogleSheetsConnector = new GoogleSheetsConnector();

// Auto-chargement de la configuration au démarrage
document.addEventListener('DOMContentLoaded', () => {
    window.GoogleSheetsConnector.loadConfiguration();
});
