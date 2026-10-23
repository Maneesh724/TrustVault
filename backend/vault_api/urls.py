from django.urls import path, re_path
from .views import (
    SendOtpView, VerifyOtpView, SendEmailOtpView, VerifyEmailOtpView,
    RegisterView, LoginView, CurrentUserView, LogoutView,
    ForgotPasswordView, ResetPasswordView, ChangePasswordView,
    CreateInvitationView, VerifyInvitationView,
    PendingUsersView, ApproveUserView, RejectUserView, UserListView, UserStatusUpdateView,
    DocumentListView, DocumentDetailView, DocumentGrantView, DocumentRevokeView,
    DocumentDownloadView, AuditLogView, NotificationListView, NotificationMarkReadView,
    SecurityPolicyListView, DashboardStatsView, AiSecurityAssistantView
)

urlpatterns = [
    # Auth & Identity Endpoints (supports with and without trailing slash)
    re_path(r'^auth/send-email-otp/?$', SendEmailOtpView.as_view(), name='send-email-otp'),
    re_path(r'^auth/verify-email-otp/?$', VerifyEmailOtpView.as_view(), name='verify-email-otp'),
    re_path(r'^auth/send-otp/?$', SendOtpView.as_view(), name='send-otp'),
    re_path(r'^auth/verify-otp/?$', VerifyOtpView.as_view(), name='verify-otp'),
    re_path(r'^auth/register/owner/?$', RegisterView.as_view(), name='register-owner'),
    re_path(r'^auth/register/viewer/?$', RegisterView.as_view(), name='register-viewer'),
    re_path(r'^auth/register/?$', RegisterView.as_view(), name='register'),
    re_path(r'^auth/resend-email-otp/?$', SendEmailOtpView.as_view(), name='resend-email-otp'),
    re_path(r'^auth/change-password/?$', ChangePasswordView.as_view(), name='change-password'),
    re_path(r'^auth/login/?$', LoginView.as_view(), name='login'),
    re_path(r'^auth/me/?$', CurrentUserView.as_view(), name='current-user'),
    re_path(r'^auth/logout/?$', LogoutView.as_view(), name='logout'),
    re_path(r'^auth/forgot-password/?$', ForgotPasswordView.as_view(), name='forgot-password'),
    re_path(r'^auth/reset-password/?$', ResetPasswordView.as_view(), name='reset-password'),
    re_path(r'^auth/pending-users/?$', PendingUsersView.as_view(), name='pending-users'),
    re_path(r'^auth/users/?$', UserListView.as_view(), name='user-list'),
    re_path(r'^auth/users/(?P<user_id>[^/]+)/status/?$', UserStatusUpdateView.as_view(), name='user-status-update'),
    re_path(r'^auth/approve/?$', ApproveUserView.as_view(), name='approve-user'),
    re_path(r'^auth/reject/?$', RejectUserView.as_view(), name='reject-user'),

    # Invitation Endpoints
    re_path(r'^invitations/create/?$', CreateInvitationView.as_view(), name='create-invitation'),
    re_path(r'^invitations/verify/?$', VerifyInvitationView.as_view(), name='verify-invitation'),

    # Document Endpoints
    re_path(r'^documents/?$', DocumentListView.as_view(), name='document-list'),
    re_path(r'^documents/upload/?$', DocumentListView.as_view(), name='document-upload'),
    re_path(r'^documents/(?P<doc_id>[^/]+)/?$', DocumentDetailView.as_view(), name='document-detail'),
    re_path(r'^documents/(?P<doc_id>[^/]+)/grant/?$', DocumentGrantView.as_view(), name='document-grant'),
    re_path(r'^documents/(?P<doc_id>[^/]+)/revoke/?$', DocumentRevokeView.as_view(), name='document-revoke'),
    re_path(r'^documents/(?P<doc_id>[^/]+)/download/?$', DocumentDownloadView.as_view(), name='document-download'),

    # Audit & Security Endpoints
    re_path(r'^audit/?$', AuditLogView.as_view(), name='audit-log'),
    re_path(r'^notifications/?$', NotificationListView.as_view(), name='notifications-list'),
    re_path(r'^notifications/(?P<notif_id>[^/]+)/read/?$', NotificationMarkReadView.as_view(), name='notification-read'),
    re_path(r'^policies/?$', SecurityPolicyListView.as_view(), name='security-policies'),

    # AI Security Assistant
    re_path(r'^ai/chat/?$', AiSecurityAssistantView.as_view(), name='ai-chat'),

    # Dashboard Stats
    re_path(r'^stats/?$', DashboardStatsView.as_view(), name='dashboard-stats'),
]
