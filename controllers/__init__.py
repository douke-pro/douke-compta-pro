# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request
import logging

_logger = logging.getLogger(__name__)

class AccountingController(http.Controller):

    # --- ROUTE 1 : RÉCUPÉRATION DE LA PÉRIODE FISCALE ---
    @http.route('/accounting/fiscal-config', type='json', auth='user', methods=['POST', 'GET'], csrf=False)
    def get_fiscal_config(self, companyId=None, **post):
        try:
            # Si companyId n'est pas passé, on prend celle de l'utilisateur
            c_id = int(companyId) if companyId else request.env.company.id
            company = request.env['res.company'].sudo().browse(c_id)
            
            # Calcul des dates de l'exercice pour aujourd'hui
            fiscal_year = company.compute_fiscalyear_dates(fields.Date.today())
            
            return {
                'status': 'success',
                'fiscal_period': {
                    'start_date': fiscal_year['date_from'].strftime('%Y-%m-%d'),
                    'end_date': fiscal_year['date_to'].strftime('%Y-%m-%d'),
                }
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    # --- ROUTE 2 : CRÉATION DE L'ÉCRITURE ---
    @http.route('/accounting/move/create', type='json', auth='user', methods=['POST'], csrf=False)
    def create_journal_entry(self, **post):
        # ... (Le code de création que je vous ai donné précédemment) ...
        try:
            data = request.jsonrequest
            company_id = data.get('company_id')
            journal_code = data.get('journal_code')
            entry_date = data.get('date')
            reference = data.get('reference')
            lines = data.get('lines', [])

            if not all([company_id, journal_code, entry_date, lines]):
                return {'status': 'error', 'message': 'Données incomplètes.'}

            journal = request.env['account.journal'].sudo().search([
                ('code', '=', journal_code),
                ('company_id', '=', company_id)
            ], limit=1)

            if not journal:
                return {'status': 'error', 'message': f'Journal "{journal_code}" introuvable.'}

            move_lines = []
            for line in lines:
                account = request.env['account.account'].sudo().search([
                    ('code', '=', line['account_code']),
                    ('company_id', '=', company_id)
                ], limit=1)

                if not account:
                    return {'status': 'error', 'message': f'Compte "{line["account_code"]}" introuvable.'}

                move_lines.append((0, 0, {
                    'account_id': account.id,
                    'name': line['name'],
                    'debit': line['debit'],
                    'credit': line['credit'],
                }))

            new_move = request.env['account.move'].sudo().create({
                'company_id': company_id,
                'journal_id': journal.id,
                'date': entry_date,
                'ref': reference,
                'move_type': 'entry',
                'line_ids': move_lines,
            })

            new_move.action_post()

            return {
                'status': 'success',
                'move_id': new_move.id,
                'move_name': new_move.name
            }

        except Exception as e:
            _logger.error(f"Erreur création écriture Odoo: {str(e)}")
            return {'status': 'error', 'message': str(e)}
