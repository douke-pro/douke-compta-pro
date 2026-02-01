# -*- coding: utf-8 -*-
from odoo import models, api, fields, _
from odoo.exceptions import ValidationError
import logging

_logger = logging.getLogger(__name__)

class AccountMove(models.Model):
    _inherit = 'account.move'

    @api.model
    def create_journal_entry_via_api(self, company_id, journal_code, date, reference, lines):
        """
        Méthode API appelée par Node.js via XML-RPC.
        Crée et valide une écriture comptable.
        
        IMPORTANT : Cette méthode doit être appelée avec un utilisateur 
        ayant les droits "Accounting / Billing Manager" minimum.
        
        Args:
            company_id (int): ID de l'entreprise
            journal_code (str): Code du journal (ex: "BNK1")
            date (str): Date de l'écriture (format ISO)
            reference (str): Référence de l'écriture
            lines (list): Liste des lignes avec account_code, name, debit, credit
            
        Returns:
            dict: {status, move_id, move_name, message} ou {status, message} en cas d'erreur
        """
        try:
            _logger.info(f"🔵 API Call: create_journal_entry_via_api")
            _logger.info(f"   Company: {company_id}, Journal: {journal_code}, Date: {date}")
            _logger.info(f"   Reference: {reference}")
            _logger.info(f"   Lines count: {len(lines) if lines else 0}")

            # 1️⃣ Vérification des permissions
            if not self.env.user.has_group('account.group_account_invoice'):
                _logger.error(f"❌ Droits insuffisants pour user {self.env.user.login}")
                raise ValidationError(
                    "Droits insuffisants. Accès 'Accounting / Billing' requis."
                )

            # 2️⃣ Recherche du Journal
            journal = self.env['account.journal'].sudo().search([
                ('code', '=', journal_code),
                ('company_id', '=', int(company_id))
            ], limit=1)

            if not journal:
                _logger.error(f"❌ Journal {journal_code} introuvable pour company_id={company_id}")
                return {
                    'status': 'error',
                    'message': f'Journal "{journal_code}" introuvable dans cette entreprise.'
                }

            _logger.info(f"✅ Journal trouvé: {journal.name} (ID: {journal.id})")

            # 3️⃣ Construction des lignes
            move_lines = []
            for idx, line in enumerate(lines, start=1):
                account_code = line.get('account_code')
                
                _logger.info(f"   Traitement ligne {idx}: compte {account_code}")
                
                # Recherche du compte
                account = self.env['account.account'].sudo().search([
                    ('code', '=', account_code),
                    ('company_id', '=', int(company_id))
                ], limit=1)

                if not account:
                    _logger.error(f"❌ Compte {account_code} introuvable (ligne {idx})")
                    return {
                        'status': 'error',
                        'message': f'Compte "{account_code}" introuvable (ligne {idx}).'
                    }

                _logger.info(f"   ✅ Ligne {idx}: {account.code} - {account.name}")

                move_lines.append((0, 0, {
                    'account_id': account.id,
                    'name': line.get('name', reference),
                    'debit': float(line.get('debit', 0.0)),
                    'credit': float(line.get('credit', 0.0)),
                }))

            # 4️⃣ Création de la pièce comptable
            _logger.info(f"🔵 Création de l'écriture avec {len(move_lines)} lignes...")
            
            move = self.sudo().create({
                'company_id': int(company_id),
                'journal_id': journal.id,
                'date': date,
                'ref': reference,
                'move_type': 'entry',
                'line_ids': move_lines,
            })

            _logger.info(f"✅ Écriture créée: {move.name} (ID: {move.id})")

            # 5️⃣ Validation automatique
            move.action_post()
            _logger.info(f"✅ Écriture validée: {move.name}")

            return {
                'status': 'success',
                'move_id': move.id,
                'move_name': move.name,
                'message': f'Écriture {move.name} créée et validée avec succès.'
            }

        except ValidationError as ve:
            _logger.error(f"❌ ValidationError: {str(ve)}")
            return {'status': 'error', 'message': str(ve)}
        
        except Exception as e:
            _logger.error(f"❌ Exception: {str(e)}", exc_info=True)
            return {'status': 'error', 'message': f'Erreur interne: {str(e)}'}
