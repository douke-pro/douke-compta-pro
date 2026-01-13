# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)

class ResCompany(models.Model):
    _inherit = 'res.company'

    def compute_fiscalyear_dates_api(self, date_str=None):
        """ Appelé par Node.js pour getFiscalConfig """
        self.ensure_one()
        date_ref = fields.Date.from_string(date_str) if date_str else fields.Date.today()
        res = self.compute_fiscalyear_dates(date_ref)
        return {
            'date_from': res['date_from'].strftime('%Y-%m-%d'),
            'date_to': res['date_to'].strftime('%Y-%m-%d')
        }

class AccountMove(models.Model):
    _inherit = 'account.move'

    @api.model
    def create_journal_entry_via_api(self, company_id, journal_code, date, reference, lines):
        """ 
        C'est cette fonction que Node.js appelle via execute_kw.
        Elle doit être dans le MODEL, pas dans un CONTROLLER.
        """
        try:
            # 1. Récupérer le journal
            journal = self.env['account.journal'].sudo().search([
                ('code', '=', journal_code),
                ('company_id', '=', company_id)
            ], limit=1)

            if not journal:
                raise UserError(_('Journal "%s" introuvable pour cette société.') % journal_code)

            # 2. Préparer les lignes
            move_lines = []
            for line in lines:
                # On cherche le compte par CODE (SYSCOHADA)
                account = self.env['account.account'].sudo().search([
                    ('code', '=', line['account_code']),
                    ('company_id', '=', company_id)
                ], limit=1)

                if not account:
                    raise UserError(_('Compte "%s" introuvable.') % line['account_code'])

                move_lines.append((0, 0, {
                    'account_id': account.id,
                    'name': line.get('name', reference),
                    'debit': float(line.get('debit', 0.0)),
                    'credit': float(line.get('credit', 0.0)),
                }))

            # 3. Création de la pièce
            move = self.create({
                'company_id': company_id,
                'journal_id': journal.id,
                'date': date,
                'ref': reference,
                'move_type': 'entry',
                'line_ids': move_lines,
            })

            # 4. Validation (Post)
            move.action_post()

            return {
                'status': 'success',
                'move_id': move.id,
                'move_name': move.name
            }

        except Exception as e:
            _logger.error(f"Erreur API Odoo: {str(e)}")
            return {'status': 'error', 'message': str(e)}
