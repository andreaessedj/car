---
## Aggiornamento B: integrazione in componenti React
- `components/VipCTAButton.tsx` aggiunto (link BMC 1€ / 1 mese).
- `components/VipPromoModal.tsx` aggiornato: 1 mese attivo, 6 e 12 mesi non selezionabili.
- Ripulito `car-main/index.html` dal pulsante flottante.
- `utils/vip.ts` helper `addVipDays` aggiunto (non breaking).
- `vip-confirm.html` presente per l'attivazione post-pagamento.

### Prezzi attivi
- 1 mese = 1 € ✅
- 6 mesi = 5 € 🚫 non selezionabile
- 1 anno = 9 € 🚫 non selezionabile
