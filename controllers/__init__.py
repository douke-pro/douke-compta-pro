# -*- coding: utf-8 -*-
from odoo import models, api, fields, _
from odoo.exceptions import UserError

class AccountMove(models.Model):
    _inherit = 'account.move'

    @api.model
    def create_journal_entry_via_api(self, company_id, journal_code, date, reference, lines):
        """
        Méthode robuste appelée par Node.js via XML-RPC (execute_kw)
        """
        try:
            # 1. Vérification du Journal
            journal = self.env['account.journal'].sudo().search([
                ('code', '=', journal_code),
                ('company_id', '=', int(company_id))
            ], limit=1)

            if not journal:
                return {'status': 'error', 'message': f'Journal {journal_code} introuvable.'}

            # 2. Construction des lignes (Format Odoo [0, 0, {values}])
            move_lines = []
            for line in lines:
                # Recherche du compte par CODE (ex: 521100)
                account = self.env['account.account'].sudo().search([
                    ('code', '=', line.get('account_code')),
                    ('company_id', '=', int(company_id))
                ], limit=1)

                if not account:
                    return {'status': 'error', 'message': f'Compte {line.get("account_code")} introuvable.'}

                move_lines.append((0, 0, {
                    'account_id': account.id,
                    'name': line.get('name', reference),
                    'debit': float(line.get('debit', 0.0)),
                    'credit': float(line.get('credit', 0.0)),
                }))

            # 3. Création et Validation
            move = self.create({
                'company_id': int(company_id),
                'journal_id': journal.id,
                'date': date,
                'ref': reference,
                'move_type': 'entry',
                'line_ids': move_lines,
            })
            
            move.action_post() # Validation automatique

            return {
                'status': 'success',
                'move_id': move.id,
                'move_name': move.name
            }

        except Exception as e:
            return {'status': 'error', 'message': str(e)}
