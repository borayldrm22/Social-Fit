---
name: feature-delivery-checklist
description: Bir Social Fit feature'ının "done" sayılması için gereken Definition of Done. Supervisor feature kapatmadan ve qa-reviewer'a göndermeden önce bu listeyi çalıştırır.
---

# Definition of Done — Feature Delivery Checklist

Bir feature ancak aşağıdakilerin **hepsi** ✅ olduğunda kapatılır.

```
[ ]  1. Handoff dosyası oluşturuldu (.cursor/handoffs/<slug>.md)
[ ]  2. feature-spec acceptance criteria üretti, handoff'a yapıştırıldı
[ ]  3. UI değişiklikleri tamamlandı (ui-designer)
[ ]  4. API/backend contract netleşti ve kontrol edildi (backend-ui-bridge)
[ ]  5. Mobile API client gerekiyorsa güncellendi
[ ]  6. Loading state eklendi (data-fetch eden her ekranda)
[ ]  7. Error state eklendi
[ ]  8. Empty state eklendi (liste döndüren her ekranda)
[ ]  9. Design token dışına çıkılmadı (renk/font/spacing/radius)
[ ] 10. Hardcoded color/font/spacing/radius/shadow kullanılmadı
[ ] 11. Yeni route varsa authMiddleware doğru uygulandı
[ ] 12. Prisma schema değiştiyse migration adı önerildi
[ ] 13. Yan etki (puan/streak/notification) ihtiyacı varsa servis çağrıldı
[ ] 14. Changed Files listesi handoff dosyasına yazıldı
[ ] 15. qa-reviewer çağrıldı ve PASS aldı (trivial fix değilse)
[ ] 16. Supervisor final raporu kullanıcıya verdi
```

## Trivial fix istisnası

Şu durumlar Definition of Done'dan muaftır:
- Tek satır typo / copy düzeltmesi
- Tek dosya, < 10 satır bug fix
- Açık ve risksiz import düzeltmesi

Bu durumlarda supervisor doğrudan yapar, handoff ve QA atlanır.

## Çekirdek prensip

Bir feature "done" demek, **kullanıcının o feature'ı kullanırken loading-error-empty üç state'inde de patlamamış olması** demek. Bu yüzden bu üçü liste başında.
