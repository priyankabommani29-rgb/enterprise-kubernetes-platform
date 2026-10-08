# Disaster Recovery Plan

## What is protected, and where

| Asset | Backed up in | Method | Frequency |
|---|---|---|---|
| Application manifests, network policies, RBAC, HPA, PDBs | GitHub | GitOps, ArgoCD syncs from Git | Every commit |
| Container images | ghcr.io | Built by CI, tagged with commit ID | Every build |
| PostgreSQL data | `postgres-backup-pvc` plus manual dumps | CronJob `pg_dump`, 7-day retention | Daily 02:00 UTC |
| Sealed Secrets private key | Offline copy (not in Git) | `kubectl get secret -l sealedsecrets.bitnami.com/sealed-secrets-key` | After install and on key rotation |
| ArgoCD Application definition | `argocd/application.yaml` in Git | Git | Every commit |
| Monitoring and logging | Helm values files | Reinstalled from values | n/a |

## Targets (local lab)

- **RPO** (data loss tolerated): 24 hours, set by the nightly backup. Tighten with a more frequent CronJob.
- **RTO** (time to recover): about 45 minutes for a full cluster rebuild.

## Restore: database only (tested)

1. Copy the dump into the Postgres pod: `kubectl cp backups/ecommerce.sql default/<pod>:/tmp/restore.sql`
2. Apply it: `kubectl exec <pod> -- psql -U admin -d ecommerce -f /tmp/restore.sql`
3. Verify with a `SELECT` on a known table.

This procedure was tested: a test table was dropped, the dump was restored, and all 3 rows returned.

## Restore: full cluster loss

1. `minikube delete`, then `minikube start --driver=docker --memory=4096 --cpus=2` (add `--cni=calico` to enforce NetworkPolicies).
2. `minikube addons enable ingress` and `minikube addons enable metrics-server`.
3. Install ArgoCD (`kubectl apply -n argocd --server-side --force-conflicts -f <install.yaml>`).
4. **Restore the Sealed Secrets key before applying the app:** install the controller, apply `sealed-secrets-key-backup.yaml`, then restart the controller so it loads the old key.
5. `kubectl apply -f argocd/application.yaml`. ArgoCD recreates everything in `kubernetes/ecommerce` from Git.
6. Reinstall monitoring and logging with the saved Helm values files.
7. Recreate the PostgreSQL deployment, then restore the latest dump (see above).
8. Verify: ArgoCD shows Synced and Healthy, pods are Running, and data queries return rows.

## Known gaps

- Backups live on the same cluster as the database. A node loss would take both. Production should copy dumps to off-cluster storage (S3, GCS or Azure Blob).
- No etcd snapshot. On managed Kubernetes the provider handles the control plane. On self-managed clusters, schedule `etcdctl snapshot save`.
- The backup CronJob and Postgres live in the `default` namespace and are applied by hand, not yet under ArgoCD.
- Redis data is treated as a cache and is not backed up.
- Restores are tested manually. Production should schedule a regular restore test.
