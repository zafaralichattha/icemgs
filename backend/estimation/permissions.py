"""
Custom permissions for ICEMGS
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Permission check for admin users only"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has a `user` attribute.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Admin users can edit anything
        if request.user.role == 'admin':
            return True

        # Write permissions are only allowed to the owner of the object
        return obj.user == request.user
