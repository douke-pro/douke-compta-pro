// =============================================================================
// 🧩 DOUKÈ Compta Pro - Composants Réutilisables v3.2
// =============================================================================

(function() {
    'use strict';

    console.log('🧩 Chargement du module Composants...');

    // =============================================================================
    // 🎨 GESTIONNAIRE DE COMPOSANTS UI
    // =============================================================================
    class ComponentManager {
        constructor() {
            this.components = new Map();
            this.templates = new Map();
            this.validators = new Map();
            
            this.initializeComponents();
            this.initializeValidators();
        }

        initializeComponents() {
            // Enregistrer tous les composants
            this.registerComponent('DataTable', DataTableComponent);
            this.registerComponent('FormBuilder', FormBuilderComponent);
            this.registerComponent('ChartWidget', ChartWidgetComponent);
            this.registerComponent('SearchFilter', SearchFilterComponent);
            this.registerComponent('Pagination', PaginationComponent);
            this.registerComponent('Modal', ModalComponent);
            this.registerComponent('Dropdown', DropdownComponent);
            this.registerComponent('DatePicker', DatePickerComponent);
            this.registerComponent('NumberInput', NumberInputComponent);
            this.registerComponent('AccountSelector', AccountSelectorComponent);
        }

        initializeValidators() {
            this.validators.set('required', (value) => {
                return value && value.toString().trim().length > 0;
            });

            this.validators.set('email', (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            });

            this.validators.set('phone', (value) => {
                const phoneRegex = /^(\+225\s?)?[0-9\s-]{8,}$/;
                return phoneRegex.test(value);
            });

            this.validators.set('number', (value) => {
                return !isNaN(parseFloat(value)) && isFinite(value);
            });

            this.validators.set('positive', (value) => {
                return parseFloat(value) >= 0;
            });
        }

        registerComponent(name, componentClass) {
            this.components.set(name, componentClass);
        }

        createComponent(name, container, options = {}) {
            const ComponentClass = this.components.get(name);
            if (!ComponentClass) {
                throw new Error(`Composant "${name}" non trouvé`);
            }

            return new ComponentClass(container, options);
        }

        validate(rules, data) {
            const errors = {};

            Object.keys(rules).forEach(field => {
                const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
                const value = data[field];

                fieldRules.forEach(rule => {
                    if (typeof rule === 'string') {
                        const validator = this.validators.get(rule);
                        if (validator && !validator(value)) {
                            if (!errors[field]) errors[field] = [];
                            errors[field].push(`Validation ${rule} échouée`);
                        }
                    } else if (typeof rule === 'function') {
                        const result = rule(value, data);
                        if (result !== true) {
                            if (!errors[field]) errors[field] = [];
                            errors[field].push(result || 'Validation échouée');
                        }
                    }
                });
            });

            return {
                valid: Object.keys(errors).length === 0,
                errors
            };
        }
    }

    // =============================================================================
    // 📊 COMPOSANT TABLEAU DE DONNÉES
    // =============================================================================
    class DataTableComponent {
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                columns: [],
                data: [],
                sortable: true,
                filterable: true,
                paginated: true,
                pageSize: 20,
                searchable: true,
                actions: [],
                ...options
            };
            
            this.currentPage = 1;
            this.sortColumn = null;
            this.sortDirection = 'asc';
            this.filterValue = '';
            this.filteredData = [...this.options.data];
            
            this.render();
            this.bindEvents();
        }

        render() {
            this.container.innerHTML = `
                <div class="data-table-wrapper">
                    ${this.options.searchable ? this.renderSearchBar() : ''}
                    <div class="overflow-x-auto">
                        <table class="w-full data-table border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                ${this.renderHeader()}
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                ${this.renderBody()}
                            </tbody>
                        </table>
                    </div>
                    ${this.options.paginated ? this.renderPagination() : ''}
                </div>
            `;
        }

        renderSearchBar() {
            return `
                <div class="mb-4 flex justify-between items-center">
                    <div class="flex-1 max-w-md">
                        <input type="text" 
                               class="search-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" 
                               placeholder="Rechercher...">
                    </div>
                    <div class="ml-4">
                        <span class="text-sm text-gray-500">${this.filteredData.length} résultat(s)</span>
                    </div>
                </div>
            `;
        }

        renderHeader() {
            return `
                <tr>
                    ${this.options.columns.map(column => `
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${this.options.sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''}" 
                            data-column="${column.key}">
                            <div class="flex items-center">
                                ${column.label}
                                ${this.options.sortable && column.sortable !== false ? `
                                    <span class="ml-2 sort-indicator">
                                        <i class="fas fa-sort text-gray-400"></i>
                                    </span>
                                ` : ''}
                            </div>
                        </th>
                    `).join('')}
                    ${this.options.actions.length > 0 ? '<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>' : ''}
                </tr>
            `;
        }

        renderBody() {
            const startIndex = (this.currentPage - 1) * this.options.pageSize;
            const endIndex = startIndex + this.options.pageSize;
            const pageData = this.options.paginated ? 
                this.filteredData.slice(startIndex, endIndex) : 
                this.filteredData;

            if (pageData.length === 0) {
                return `
                    <tr>
                        <td colspan="${this.options.columns.length + (this.options.actions.length > 0 ? 1 : 0)}" 
                            class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            Aucune donnée disponible
                        </td>
                    </tr>
                `;
            }

            return pageData.map((row, index) => `
                <tr class="table-hover" data-index="${startIndex + index}">
                    ${this.options.columns.map(column => `
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${this.formatCellValue(row, column)}
                        </td>
                    `).join('')}
                    ${this.options.actions.length > 0 ? `
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex justify-end space-x-2">
                                ${this.options.actions.map(action => `
                                    <button class="action-btn text-${action.color || 'blue'}-600 hover:text-${action.color || 'blue'}-900" 
                                            data-action="${action.key}" 
                                            data-row-index="${startIndex + index}"
                                            title="${action.label}">
                                        <i class="${action.icon}"></i>
                                    </button>
                                `).join('')}
                            </div>
                        </td>
                    ` : ''}
                </tr>
            `).join('');
        }

        formatCellValue(row, column) {
            let value = this.getNestedValue(row, column.key);

            if (column.formatter) {
                return column.formatter(value, row);
            }

            if (column.type === 'currency') {
                return window.configManager?.formatCurrency(value) || `${value} FCFA`;
            }

            if (column.type === 'date') {
                return new Date(value).toLocaleDateString('fr-FR');
            }

            if (column.type === 'badge') {
                const badgeClass = column.badgeClasses?.[value] || 'bg-gray-100 text-gray-800';
                return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}">${value}</span>`;
            }

            return value || '-';
        }

        getNestedValue(obj, path) {
            return path.split('.').reduce((current, key) => current?.[key], obj);
        }

        renderPagination() {
            const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
            
            if (totalPages <= 1) return '';

            return `
                <div class="flex items-center justify-between mt-4">
                    <div class="text-sm text-gray-700 dark:text-gray-300">
                        Affichage de ${((this.currentPage - 1) * this.options.pageSize) + 1} à 
                        ${Math.min(this.currentPage * this.options.pageSize, this.filteredData.length)} 
                        sur ${this.filteredData.length} résultats
                    </div>
                    <div class="flex space-x-1">
                        <button class="pagination-btn px-3 py-1 border rounded" 
                                data-page="prev" 
                                ${this.currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        ${this.renderPageNumbers(totalPages)}
                        <button class="pagination-btn px-3 py-1 border rounded" 
                                data-page="next"
                                ${this.currentPage === totalPages ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        renderPageNumbers(totalPages) {
            const pages = [];
            const maxVisible = 5;
            
            let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(`
                    <button class="pagination-btn px-3 py-1 border rounded ${i === this.currentPage ? 'bg-primary text-white' : ''}" 
                            data-page="${i}">
                        ${i}
                    </button>
                `);
            }

            return pages.join('');
        }

        bindEvents() {
            // Recherche
            const searchInput = this.container.querySelector('.search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filterValue = e.target.value;
                    this.applyFilters();
                });
            }

            // Tri
            if (this.options.sortable) {
                this.container.addEventListener('click', (e) => {
                    const th = e.target.closest('th[data-column]');
                    if (th) {
                        this.sort(th.dataset.column);
                    }
                });
            }

            // Pagination
            this.container.addEventListener('click', (e) => {
                const btn = e.target.closest('.pagination-btn[data-page]');
                if (btn && !btn.disabled) {
                    const page = btn.dataset.page;
                    if (page === 'prev') {
                        this.goToPage(this.currentPage - 1);
                    } else if (page === 'next') {
                        this.goToPage(this.currentPage + 1);
                    } else {
                        this.goToPage(parseInt(page));
                    }
                }
            });

            // Actions
            this.container.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('.action-btn[data-action]');
                if (actionBtn) {
                    const action = actionBtn.dataset.action;
                    const rowIndex = parseInt(actionBtn.dataset.rowIndex);
                    const row = this.options.data[rowIndex];
                    
                    const actionConfig = this.options.actions.find(a => a.key === action);
                    if (actionConfig && actionConfig.handler) {
                        actionConfig.handler(row, rowIndex);
                    }
                }
            });
        }

        applyFilters() {
            this.filteredData = this.options.data.filter(row => {
                if (!this.filterValue) return true;
                
                const searchValue = this.filterValue.toLowerCase();
                return this.options.columns.some(column => {
                    const value = this.getNestedValue(row, column.key);
                    return value && value.toString().toLowerCase().includes(searchValue);
                });
            });

            this.currentPage = 1;
            this.render();
            this.bindEvents();
        }

        sort(columnKey) {
            if (this.sortColumn === columnKey) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = columnKey;
                this.sortDirection = 'asc';
            }

            this.filteredData.sort((a, b) => {
                const aValue = this.getNestedValue(a, columnKey);
                const bValue = this.getNestedValue(b, columnKey);
                
                let comparison = 0;
                if (aValue < bValue) comparison = -1;
                if (aValue > bValue) comparison = 1;
                
                return this.sortDirection === 'desc' ? -comparison : comparison;
            });

            this.render();
            this.bindEvents();
        }

        goToPage(page) {
            const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
            if (page >= 1 && page <= totalPages) {
                this.currentPage = page;
                this.render();
                this.bindEvents();
            }
        }

        updateData(newData) {
            this.options.data = newData;
            this.applyFilters();
        }

        refresh() {
            this.render();
            this.bindEvents();
        }
    }

    // =============================================================================
    // 📝 COMPOSANT FORMULAIRE
    // =============================================================================
    class FormBuilderComponent {
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                fields: [],
                layout: 'vertical', // vertical, horizontal, grid
                columns: 2,
                submitLabel: 'Enregistrer',
                resetLabel: 'Réinitialiser',
                showReset: true,
                validation: {},
                ...options
            };
            
            this.data = {};
            this.errors = {};
            
            this.render();
            this.bindEvents();
        }

        render() {
            this.container.innerHTML = `
                <form class="form-builder">
                    <div class="form-fields ${this.getLayoutClass()}">
                        ${this.options.fields.map(field => this.renderField(field)).join('')}
                    </div>
                    <div class="form-actions flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        ${this.options.showReset ? `
                            <button type="button" class="reset-btn px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                ${this.options.resetLabel}
                            </button>
                        ` : ''}
                        <button type="submit" class="submit-btn px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                            ${this.options.submitLabel}
                        </button>
                    </div>
                </form>
            `;
        }

        getLayoutClass() {
            switch (this.options.layout) {
                case 'horizontal':
                    return 'space-y-4';
                case 'grid':
                    return `grid grid-cols-1 md:grid-cols-${this.options.columns} gap-4`;
                default:
                    return 'space-y-4';
            }
        }

        renderField(field) {
            const fieldId = `field_${field.name}`;
            const hasError = this.errors[field.name];
            const errorClass = hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600';

            let fieldHtml = '';

            switch (field.type) {
                case 'text':
                case 'email':
                case 'password':
                case 'tel':
                    fieldHtml = `
                        <input type="${field.type}" 
                               id="${fieldId}" 
                               name="${field.name}"
                               value="${this.data[field.name] || ''}"
                               placeholder="${field.placeholder || ''}"
                               ${field.required ? 'required' : ''}
                               class="w-full px-3 py-2 border ${errorClass} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    `;
                    break;

                case 'number':
                    fieldHtml = `
                        <input type="number" 
                               id="${fieldId}" 
                               name="${field.name}"
                               value="${this.data[field.name] || ''}"
                               min="${field.min || ''}"
                               max="${field.max || ''}"
                               step="${field.step || '1'}"
                               ${field.required ? 'required' : ''}
                               class="w-full px-3 py-2 border ${errorClass} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    `;
                    break;

                case 'select':
                    fieldHtml = `
                        <select id="${fieldId}" 
                                name="${field.name}"
                                ${field.required ? 'required' : ''}
                                class="w-full px-3 py-2 border ${errorClass} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">-- Sélectionner --</option>
                            ${field.options.map(option => `
                                <option value="${option.value}" ${this.data[field.name] === option.value ? 'selected' : ''}>
                                    ${option.label}
                                </option>
                            `).join('')}
                        </select>
                    `;
                    break;

                case 'textarea':
                    fieldHtml = `
                        <textarea id="${fieldId}" 
                                  name="${field.name}"
                                  rows="${field.rows || 3}"
                                  placeholder="${field.placeholder || ''}"
                                  ${field.required ? 'required' : ''}
                                  class="w-full px-3 py-2 border ${errorClass} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">${this.data[field.name] || ''}</textarea>
                    `;
                    break;

                case 'checkbox':
                    fieldHtml = `
                        <label class="flex items-center">
                            <input type="checkbox" 
                                   id="${fieldId}" 
                                   name="${field.name}"
                                   ${this.data[field.name] ? 'checked' : ''}
                                   class="rounded border-gray-300 text-primary focus:ring-primary">
                            <span class="ml-2 text-sm text-gray-900 dark:text-white">${field.checkboxLabel || field.label}</span>
                        </label>
                    `;
                    break;

                case 'date':
                    fieldHtml = `
                        <input type="date" 
                               id="${fieldId}" 
                               name="${field.name}"
                               value="${this.data[field.name] || ''}"
                               ${field.required ? 'required' : ''}
                               class="w-full px-3 py-2 border ${errorClass} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    `;
                    break;

                default:
                    fieldHtml = `<div class="text-red-500">Type de champ non supporté: ${field.type}</div>`;
            }

            return `
                <div class="form-field">
                    ${field.type !== 'checkbox' ? `
                        <label for="${fieldId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ${field.label}
                            ${field.required ? '<span class="text-red-500">*</span>' : ''}
                        </label>
                    ` : ''}
                    ${fieldHtml}
                    ${field.help ? `
                        <p class="mt-1 text-xs text-gray-500">${field.help}</p>
                    ` : ''}
                    ${hasError ? `
                        <p class="mt-1 text-xs text-red-500">${this.errors[field.name].join(', ')}</p>
                    ` : ''}
                </div>
            `;
        }

        bindEvents() {
            const form = this.container.querySelector('.form-builder');
            
            // Gestion de la soumission
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });

            // Gestion du reset
            const resetBtn = this.container.querySelector('.reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.reset();
                });
            }

            // Mise à jour des données en temps réel
            form.addEventListener('input', (e) => {
                this.updateFieldValue(e.target);
            });

            form.addEventListener('change', (e) => {
                this.updateFieldValue(e.target);
            });
        }

        updateFieldValue(input) {
            const { name, type, checked, value } = input;
            
            if (type === 'checkbox') {
                this.data[name] = checked;
            } else {
                this.data[name] = value;
            }

            // Validation en temps réel
            if (this.options.validation[name]) {
                this.validateField(name);
            }
        }

        validateField(fieldName) {
            const rules = this.options.validation[fieldName];
            if (!rules) return true;

            const fieldData = { [fieldName]: this.data[fieldName] };
            const validation = window.componentManager.validate({ [fieldName]: rules }, fieldData);
            
            if (validation.valid) {
                delete this.errors[fieldName];
            } else {
                this.errors[fieldName] = validation.errors[fieldName];
            }

            // Mettre à jour l'affichage du champ
            this.updateFieldDisplay(fieldName);
            
            return validation.valid;
        }

        updateFieldDisplay(fieldName) {
            const field = this.container.querySelector(`[name="${fieldName}"]`);
            const fieldContainer = field?.closest('.form-field');
            
            if (!fieldContainer) return;

            // Mettre à jour les classes d'erreur
            const input = fieldContainer.querySelector('input, select, textarea');
            if (input) {
                if (this.errors[fieldName]) {
                    input.classList.remove('border-gray-300', 'dark:border-gray-600');
                    input.classList.add('border-red-500');
                } else {
                    input.classList.remove('border-red-500');
                    input.classList.add('border-gray-300', 'dark:border-gray-600');
                }
            }

            // Mettre à jour le message d'erreur
            const existingError = fieldContainer.querySelector('.text-red-500');
            if (existingError) {
                existingError.remove();
            }

            if (this.errors[fieldName]) {
                const errorMsg = document.createElement('p');
                errorMsg.className = 'mt-1 text-xs text-red-500';
                errorMsg.textContent = this.errors[fieldName].join(', ');
                fieldContainer.appendChild(errorMsg);
            }
        }

        handleSubmit() {
            // Valider tous les champs
            this.errors = {};
            let isValid = true;

            Object.keys(this.options.validation).forEach(fieldName => {
                if (!this.validateField(fieldName)) {
                    isValid = false;
                }
            });

            if (isValid) {
                if (this.options.onSubmit) {
                    this.options.onSubmit(this.data);
                }
            } else {
                console.log('Erreurs de validation:', this.errors);
            }
        }

        reset() {
            this.data = {};
            this.errors = {};
            this.render();
            this.bindEvents();
        }

        setData(data) {
            this.data = { ...data };
            this.render();
            this.bindEvents();
        }

        getData() {
            return { ...this.data };
        }

        setFieldValue(fieldName, value) {
            this.data[fieldName] = value;
            const field = this.container.querySelector(`[name="${fieldName}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = value;
                } else {
                    field.value = value;
                }
            }
        }

        getFieldValue(fieldName) {
            return this.data[fieldName];
        }
    }

    // =============================================================================
    // 📈 COMPOSANT GRAPHIQUE
    // =============================================================================
    class ChartWidgetComponent {
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                type: 'bar', // bar, line, pie, doughnut
                data: { labels: [], datasets: [] },
                title: '',
                height: 300,
                responsive: true,
                ...options
            };
            
            this.render();
        }

        render() {
            this.container.innerHTML = `
                <div class="chart-widget">
                    ${this.options.title ? `
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">${this.options.title}</h3>
                    ` : ''}
                    <div class="chart-container" style="height: ${this.options.height}px;">
                        ${this.renderChart()}
                    </div>
                </div>
            `;
        }

        renderChart() {
            // Simulation de graphique avec Chart.js (à remplacer par une vraie implémentation)
            const { data } = this.options;
            
            if (this.options.type === 'pie' || this.options.type === 'doughnut') {
                return this.renderPieChart(data);
            } else {
                return this.renderBarChart(data);
            }
        }

        renderPieChart(data) {
            const total = data.datasets[0]?.data?.reduce((sum, val) => sum + val, 0) || 0;
            
            return `
                <div class="flex items-center justify-center h-full">
                    <div class="grid grid-cols-2 gap-4 w-full">
                        ${data.labels.map((label, index) => {
                            const value = data.datasets[0]?.data[index] || 0;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `
                                <div class="flex items-center">
                                    <div class="w-4 h-4 rounded mr-2" style="background-color: ${this.getColor(index)}"></div>
                                    <span class="text-sm text-gray-700 dark:text-gray-300">${label}: ${percentage}%</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        renderBarChart(data) {
            const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
            
            return `
                <div class="flex items-end justify-around h-full p-4">
                    ${data.labels.map((label, index) => {
                        const value = data.datasets[0]?.data[index] || 0;
                        const height = maxValue > 0 ? ((value / maxValue) * 80) : 0;
                        return `
                            <div class="flex flex-col items-center">
                                <div class="bg-primary rounded-t" 
                                     style="width: 40px; height: ${height}%; min-height: 2px;"
                                     title="${window.configManager?.formatCurrency(value) || value}"></div>
                                <span class="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center max-w-[60px] truncate">${label}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        getColor(index) {
            const colors = [
                '#5D5CDE', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
                '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
            ];
            return colors[index % colors.length];
        }

        updateData(newData) {
            this.options.data = newData;
            this.render();
        }
    }

    // =============================================================================
    // 🔍 COMPOSANT RECHERCHE ET FILTRES
    // =============================================================================
    class SearchFilterComponent {
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                filters: [],
                searchPlaceholder: 'Rechercher...',
                onFilter: null,
                onSearch: null,
                ...options
            };
            
            this.filterValues = {};
            this.searchValue = '';
            
            this.render();
            this.bindEvents();
        }

        render() {
            this.container.innerHTML = `
                <div class="search-filter-component">
                    <div class="grid grid-cols-1 md:grid-cols-${this.options.filters.length + 1} gap-4">
                        <div>
                            <input type="text" 
                                   class="search-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" 
                                   placeholder="${this.options.searchPlaceholder}">
                        </div>
                        ${this.options.filters.map(filter => this.renderFilter(filter)).join('')}
                        <div class="flex items-end">
                            <button class="reset-filters-btn px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <i class="fas fa-undo mr-2"></i>Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderFilter(filter) {
            return `
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${filter.label}</label>
                    <select class="filter-select w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" 
                            data-filter="${filter.key}">
                        <option value="">Tous</option>
                        ${filter.options.map(option => `
                            <option value="${option.value}" ${this.filterValues[filter.key] === option.value ? 'selected' : ''}>
                                ${option.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }

        bindEvents() {
            // Recherche
            const searchInput = this.container.querySelector('.search-input');
            searchInput.addEventListener('input', (e) => {
                this.searchValue = e.target.value;
                this.handleSearch();
            });

            // Filtres
            this.container.addEventListener('change', (e) => {
                if (e.target.classList.contains('filter-select')) {
                    const filterKey = e.target.dataset.filter;
                    this.filterValues[filterKey] = e.target.value;
                    this.handleFilter();
                }
            });

            // Reset
            const resetBtn = this.container.querySelector('.reset-filters-btn');
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }

        handleSearch() {
            if (this.options.onSearch) {
                this.options.onSearch(this.searchValue);
            }
        }

        handleFilter() {
            if (this.options.onFilter) {
                this.options.onFilter(this.filterValues);
            }
        }

        reset() {
            this.filterValues = {};
            this.searchValue = '';
            
            // Réinitialiser les champs
            this.container.querySelector('.search-input').value = '';
            this.container.querySelectorAll('.filter-select').forEach(select => {
                select.value = '';
            });

            this.handleSearch();
            this.handleFilter();
        }

        getSearchValue() {
            return this.searchValue;
        }

        getFilterValues() {
