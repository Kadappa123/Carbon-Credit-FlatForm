from django.contrib import admin
from .models import Transaction, CreditListing, RetiredCredit, PurchaseRestriction
admin.site.register(Transaction)
admin.site.register(CreditListing)
admin.site.register(RetiredCredit)
admin.site.register(PurchaseRestriction)
