# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request
import json
import logging

_logger = logging.getLogger(__name__)

class AccountingController(http.Controller):

    @http.route('/accounting/move/create', type='json', auth='user', methods=['POST'], csrf=False)
    def create_journal_entry(self, **post):
        try:
            # 1. Récupération des données JSON
            data = request.jsonrequest
            company_id = data.get('company_id')
            journal_code = data.get('journal_code')
            entry_date = data.get('date')
            reference = data.get('reference')
            lines = data.get('lines', [])

            if not all([company_id, journal_code, entry_date, lines]):
                return {'status': 'error', 'message': 'Données incomplètes.'}

            # 2. Recherche du Journal par Code
            journal = request.env['account.journal'].sudo().search([
                ('code', '=', journal_code),
                ('company_id', '=', company_id)
            ], limit=1)

            if not journal:
                return {'status': 'error', 'message': f'Journal "{journal_code}" introuvable.'}

            # 3. Préparation des lignes (mapping Codes -> IDs)
            move_lines = []
            for line in lines:
                # Recherche du compte par code
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

            # 4. Création de la pièce comptable (account.move)
            # Odoo vérifiera automatiquement la période fiscale lors de la création
            new_move = request.env['account.move'].sudo().create({
                'company_id': company_id,
                'journal_id': journal.id,
                'date': entry_date,
                'ref': reference,
                'move_type': 'entry', # Écriture manuelle
                'line_ids': move_lines,
            })

            # 5. Validation (Postage) de l'écriture
            # Si vous voulez qu'elle reste en brouillon, commentez la ligne ci-dessous
            new_move.action_post()

            # 6. Retourner la référence officielle générée par Odoo (ex: MISC/2026/01/0001)
            return {
                'status': 'success',
                'move_id': new_move.id,
                'move_name': new_move.name # C'est le numéro séquentiel Odoo
            }

        except Exception as e:
            _logger.error(f"Erreur création écriture Odoo: {str(e)}")
            return {'status': 'error', 'message': str(e)}
