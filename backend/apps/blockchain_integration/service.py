from web3 import Web3
from django.conf import settings
import json
import os
import logging

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Service layer for interacting with Ganache (local Ethereum) via Web3.
    Handles credit tokenization, transfers, and retirement.
    """

    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.GANACHE_URL))
        self.contract = self._load_contract()

    def _load_contract(self):
        """Load deployed CarbonCredit smart contract ABI"""
        contract_address = settings.CONTRACT_ADDRESS
        if not contract_address:
            logger.warning("CONTRACT_ADDRESS not set — blockchain calls will be mocked.")
            return None
        try:
            abi_path = os.path.join(
                settings.BASE_DIR.parent,
                'blockchain', 'build', 'CarbonCredit.json'
            )
            with open(abi_path) as f:
                artifact = json.load(f)
            return self.w3.eth.contract(
                address=Web3.to_checksum_address(contract_address),
                abi=artifact['abi']
            )
        except Exception as e:
            logger.error(f"Failed to load contract: {e}")
            return None

    def is_connected(self):
        return self.w3.is_connected()

    def create_wallet(self):
        """Generate a new Ethereum wallet"""
        account = self.w3.eth.account.create()
        return {
            'address': account.address,
            'private_key': account.key.hex(),
        }

    def mint_credits(self, to_address: str, amount: int, submission_id: str) -> dict:
        """Mint (tokenize) carbon credits to a company wallet"""
        if not self.contract or not to_address:
            return self._mock_tx('mint', amount)
        try:
            nonce = self.w3.eth.get_transaction_count(settings.DEPLOYER_ADDRESS)
            txn = self.contract.functions.mintCredits(
                Web3.to_checksum_address(to_address),
                amount,
                submission_id,
            ).build_transaction({
                'from': settings.DEPLOYER_ADDRESS,
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': self.w3.to_wei('20', 'gwei'),
            })
            signed = self.w3.eth.account.sign_transaction(txn, settings.DEPLOYER_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            return {
                'tx_hash': tx_hash.hex(),
                'block_number': receipt.blockNumber,
                'status': 'success' if receipt.status == 1 else 'failed',
            }
        except Exception as e:
            logger.error(f"Mint failed: {e}")
            raise

    def transfer_credits(self, from_address: str, to_address: str, amount: int, transaction_id: str) -> dict:
        """Transfer credits between wallets (smart contract enforces rules)"""
        if not self.contract or not from_address or not to_address:
            return self._mock_tx('transfer', amount)
        try:
            nonce = self.w3.eth.get_transaction_count(settings.DEPLOYER_ADDRESS)
            txn = self.contract.functions.transferCredits(
                Web3.to_checksum_address(from_address),
                Web3.to_checksum_address(to_address),
                amount,
                transaction_id,
            ).build_transaction({
                'from': settings.DEPLOYER_ADDRESS,
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': self.w3.to_wei('20', 'gwei'),
            })
            signed = self.w3.eth.account.sign_transaction(txn, settings.DEPLOYER_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            return {
                'tx_hash': tx_hash.hex(),
                'block_number': receipt.blockNumber,
                'status': 'success' if receipt.status == 1 else 'failed',
            }
        except Exception as e:
            logger.error(f"Transfer failed: {e}")
            raise

    def retire_credits(self, address: str, amount: int) -> dict:
        """Permanently burn credits (retirement)"""
        if not self.contract or not address:
            return self._mock_tx('retire', amount)
        try:
            nonce = self.w3.eth.get_transaction_count(settings.DEPLOYER_ADDRESS)
            txn = self.contract.functions.retireCredits(
                Web3.to_checksum_address(address),
                amount,
            ).build_transaction({
                'from': settings.DEPLOYER_ADDRESS,
                'nonce': nonce,
                'gas': 150000,
                'gasPrice': self.w3.to_wei('20', 'gwei'),
            })
            signed = self.w3.eth.account.sign_transaction(txn, settings.DEPLOYER_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            return {
                'tx_hash': tx_hash.hex(),
                'block_number': receipt.blockNumber,
                'status': 'success' if receipt.status == 1 else 'failed',
            }
        except Exception as e:
            logger.error(f"Retire failed: {e}")
            raise

    def get_balance(self, address: str) -> int:
        """Get on-chain credit balance for an address"""
        if not self.contract or not address:
            return 0
        try:
            return self.contract.functions.balanceOf(
                Web3.to_checksum_address(address)
            ).call()
        except Exception as e:
            logger.error(f"Balance check failed: {e}")
            return 0

    def _mock_tx(self, action: str, amount: int) -> dict:
        """Mock blockchain response for dev without deployed contract"""
        import uuid
        logger.info(f"MOCK blockchain {action} for {amount} credits")
        return {
            'tx_hash': '0x' + uuid.uuid4().hex + uuid.uuid4().hex[:2],
            'block_number': 1000,
            'status': 'success',
            'mock': True,
        }
