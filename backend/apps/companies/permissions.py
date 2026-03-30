from rest_framework.permissions import BasePermission


class IsCompanyUser(BasePermission):
    """
    Allows access only to users linked with a Company.
    """

    def has_permission(self, request, view):
        user = request.user

        return (
            user is not None and
            user.is_authenticated and
            hasattr(user, 'company')
        )