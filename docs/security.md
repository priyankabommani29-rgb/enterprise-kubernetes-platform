# Security Controls

| Control | Implementation | Verified |
|---|---|---|
| RBAC | Read-only `developer` ServiceAccount, Role and RoleBinding in `ecommerce` | `kubectl auth can-i`: list pods yes; delete pods, get secrets, other namespaces no |
| Pod Security | Namespace enforces `baseline`, warns on `restricted` | Privileged pod rejected |
| Workload hardening | Backend runs non-root, drops all capabilities, read-only root filesystem, no SA token | Pod healthy |
| Image scanning | Trivy scans of nginx and http-echo | Reports reviewed |
| Secrets | Sealed Secrets: encrypted in Git, decrypted only in-cluster | SealedSecret became Secret `db-credentials` |
| Network policies | Default-deny ingress plus allow rules for frontend to backend and for the ingress controller | **Defined but NOT enforced locally** (see below) |

## Known gap: NetworkPolicy enforcement on Minikube

The NetworkPolicy manifests are applied, but a test pod from another namespace still reached the
backend (HTTP 200). Minikube's default network plugin does not enforce NetworkPolicies, so the
manifests have no effect locally.

**Production remedy:** use a CNI that enforces policies (Calico or Cilium). Managed clusters such as
EKS, GKE and AKS support this. Locally, `minikube start --cni=calico` enforces them. Re-run the
blocked/allowed curl tests after switching to confirm.

## Remaining production hardening

- Frontend runs stock nginx as root. Switch to `nginxinc/nginx-unprivileged` on port 8080.
- Enable etcd encryption at rest (API server EncryptionConfiguration or a cloud KMS).
- Pin image tags and fail CI builds on CRITICAL Trivy findings (added in Phase 15).
