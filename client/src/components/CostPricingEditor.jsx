import { useEffect, useState } from 'react';
import api from '../api';
import { calculateTourPrice, calculateSmallGroupPrice, OPTIONAL_COST_CATEGORIES } from '../lib/pricing';

// Faz 2 — Cost & Pricing screen for a single tour. Three editable lists:
//   - Vehicle tiers: tiered FIXED cost by party size (e.g. Vito up to 5,
//     Sprinter 6+) — exactly one tier applies per booking.
//   - Fixed costs: other flat per-tour fixed costs (e.g. the guide).
//   - Optional costs: per-person items the customer picks themselves at
//     booking time (entrance fees, food, extras) — always charged at raw
//     cost, no markup.
// Role-based markup (from Admin > Settings) applies ONLY to vehicle tier +
// fixed costs. A live preview at the bottom recalculates on every keystroke
// using the exact same formula the server will use for real bookings later.

function emptyVehicleTier() {
  return { min_people: 1, max_people: '', vehicle_name: '', cost: '' };
}
function emptyFixedCost() {
  return { name: '', cost: '' };
}
function emptyOptionalCost() {
  return { name: '', cost_per_person: '', category: 'other' };
}

// The lists coming from the tour don't always carry stable ids yet (a
// brand-new row added in this session has none until saved) — key by index
// instead so React doesn't warn and so removing a row works predictably.

export default function CostPricingEditor({
  vehicleTiers,
  fixedCosts,
  optionalCosts,
  onChangeVehicleTiers,
  onChangeFixedCosts,
  onChangeOptionalCosts,
  // Faz 3 — Small Group tours skip the vehicle-tier/fixed-cost/markup
  // machinery entirely: they have one flat per-person price (the tour's own
  // `price` field, passed here as basePricePerPerson) x guests, with only
  // the optional-add-ons editor still shown. Defaults keep this component
  // behaving exactly as before for Private tours (the default).
  bookingType = 'private',
  basePricePerPerson = 0,
}) {
  const isSmallGroup = bookingType === 'small_group';
  const [markupRates, setMarkupRates] = useState({ agency_markup_percent: 20, customer_markup_percent: 10 });
  const [previewPartySize, setPreviewPartySize] = useState(2);
  const [previewRole, setPreviewRole] = useState('customer');
  const [previewSelected, setPreviewSelected] = useState([]);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) =>
        setMarkupRates({
          agency_markup_percent: res.data.agency_markup_percent,
          customer_markup_percent: res.data.customer_markup_percent,
        })
      )
      .catch(() => {});
  }, []);

  function updateTier(idx, field, value) {
    onChangeVehicleTiers(vehicleTiers.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  }
  function addTier() {
    onChangeVehicleTiers([...vehicleTiers, emptyVehicleTier()]);
  }
  function removeTier(idx) {
    onChangeVehicleTiers(vehicleTiers.filter((_, i) => i !== idx));
  }

  function updateFixed(idx, field, value) {
    onChangeFixedCosts(fixedCosts.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }
  function addFixed() {
    onChangeFixedCosts([...fixedCosts, emptyFixedCost()]);
  }
  function removeFixed(idx) {
    onChangeFixedCosts(fixedCosts.filter((_, i) => i !== idx));
  }

  function updateOptional(idx, field, value) {
    onChangeOptionalCosts(optionalCosts.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }
  function addOptional() {
    onChangeOptionalCosts([...optionalCosts, emptyOptionalCost()]);
  }
  function removeOptional(idx) {
    onChangeOptionalCosts(optionalCosts.filter((_, i) => i !== idx));
  }

  // Preview uses whatever ids the rows currently have (index+1, same
  // convention the server assigns on save) so selection still works before
  // the tour has ever been saved.
  const previewOptionalCosts = optionalCosts.map((c, i) => ({ ...c, id: c.id ?? i + 1 }));
  function togglePreviewSelected(id) {
    setPreviewSelected((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  }

  const preview = isSmallGroup
    ? calculateSmallGroupPrice({
        tour: { price: basePricePerPerson, optional_costs: previewOptionalCosts },
        partySize: previewPartySize,
        selectedOptionalIds: previewSelected,
      })
    : calculateTourPrice({
        tour: {
          vehicle_tiers: vehicleTiers.map((t, i) => ({ ...t, id: t.id ?? i + 1 })),
          fixed_costs: fixedCosts.map((c, i) => ({ ...c, id: c.id ?? i + 1 })),
          optional_costs: previewOptionalCosts,
        },
        partySize: previewPartySize,
        selectedOptionalIds: previewSelected,
        role: previewRole,
        markupRates,
      });

  return (
    <div className="space-y-6">
      {isSmallGroup && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Small Group Tur — Sabit Fiyat</p>
          <p className="mt-1 text-xs">
            Bu tur Small Group (garanti kalkışlı) olduğu için Araç/Sabit Maliyet ve kâr oranı formülü
            uygulanmaz. Fiyat, yukarıdaki "Fiyat" alanındaki kişi başı tutar × kişi sayısı olarak
            hesaplanır. Sadece isteğe bağlı kalemleri (kişi başı ekstralar) burada yönetebilirsiniz.
          </p>
        </div>
      )}

      {!isSmallGroup && (
        <div>
          <h3 className="font-semibold text-gray-800">Araç (Sabit Maliyet — Kapasiteye Göre Kademeli)</h3>
          <p className="mt-1 text-xs text-gray-500">
            Kişi sayısına göre hangi aracın kullanılacağını ve maliyetini girin (örn. 1-5 kişi Vito, 6-12
            kişi Sprinter). Bu maliyete rol bazlı kâr oranı (Ayarlar sayfasından) uygulanır.
          </p>
          <div className="mt-3 space-y-2">
            {vehicleTiers.map((t, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-5 sm:items-end">
                <div>
                  <label className="label">Min Kişi</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={t.min_people}
                    onChange={(e) => updateTier(idx, 'min_people', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Max Kişi</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    placeholder="Sınırsız"
                    value={t.max_people}
                    onChange={(e) => updateTier(idx, 'max_people', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="label">Araç Adı</label>
                  <input
                    className="input"
                    placeholder="Vito"
                    value={t.vehicle_name}
                    onChange={(e) => updateTier(idx, 'vehicle_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Maliyet</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={t.cost}
                    onChange={(e) => updateTier(idx, 'cost', e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => removeTier(idx)} className="btn-danger !px-3 !py-2 text-xs">
                  Kaldır
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addTier} className="btn-secondary mt-2">
            + Araç Kademesi Ekle
          </button>
        </div>
      )}

      {!isSmallGroup && (
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-gray-800">Diğer Sabit Maliyetler</h3>
          <p className="mt-1 text-xs text-gray-500">
            Grup büyüklüğünden bağımsız, her seferinde ödenen sabit kalemler (örn. Rehber). Bu maliyetlere
            de rol bazlı kâr oranı uygulanır.
          </p>
          <div className="mt-3 space-y-2">
            {fixedCosts.map((c, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-4 sm:items-end">
                <div className="sm:col-span-2">
                  <label className="label">Kalem Adı</label>
                  <input
                    className="input"
                    placeholder="Rehber"
                    value={c.name}
                    onChange={(e) => updateFixed(idx, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Maliyet</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={c.cost}
                    onChange={(e) => updateFixed(idx, 'cost', e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => removeFixed(idx)} className="btn-danger !px-3 !py-2 text-xs">
                  Kaldır
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addFixed} className="btn-secondary mt-2">
            + Sabit Maliyet Ekle
          </button>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <h3 className="font-semibold text-gray-800">İsteğe Bağlı Kalemler (Kişi Başı)</h3>
        <p className="mt-1 text-xs text-gray-500">
          Giriş ücretleri, yemek ve ekstralar gibi — müşteri booking sırasında kendisi hangilerini
          eklemek istediğini seçer. Bu kalemlere kâr eklenmez, ham maliyet olarak yansır.
        </p>
        <div className="mt-3 space-y-2">
          {optionalCosts.map((c, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-5 sm:items-end">
              <div className="sm:col-span-2">
                <label className="label">Kalem Adı</label>
                <input
                  className="input"
                  placeholder="Efes Giriş"
                  value={c.name}
                  onChange={(e) => updateOptional(idx, 'name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Kişi Başı Maliyet</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={c.cost_per_person}
                  onChange={(e) => updateOptional(idx, 'cost_per_person', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Kategori</label>
                <select
                  className="input"
                  value={c.category}
                  onChange={(e) => updateOptional(idx, 'category', e.target.value)}
                >
                  {OPTIONAL_COST_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => removeOptional(idx)} className="btn-danger !px-3 !py-2 text-xs">
                Kaldır
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addOptional} className="btn-secondary mt-2">
          + İsteğe Bağlı Kalem Ekle
        </button>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
        <h3 className="font-semibold text-gray-800">Canlı Fiyat Önizlemesi</h3>
        <p className="mt-1 text-xs text-gray-600">
          Kaydetmeden önce formülü doğrulamak için — gerçek rezervasyon fiyatı da aynı şekilde
          hesaplanacak.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Kişi Sayısı</label>
            <input
              type="number"
              min={1}
              className="input"
              value={previewPartySize}
              onChange={(e) => setPreviewPartySize(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          {!isSmallGroup && (
            <div>
              <label className="label">Rol</label>
              <select className="input" value={previewRole} onChange={(e) => setPreviewRole(e.target.value)}>
                <option value="customer">Müşteri (%{markupRates.customer_markup_percent ?? 0})</option>
                <option value="agency">Acente (%{markupRates.agency_markup_percent ?? 0})</option>
              </select>
            </div>
          )}
        </div>
        {previewOptionalCosts.length > 0 && (
          <div className="mt-3">
            <label className="label">Eklenen İsteğe Bağlı Kalemler</label>
            <div className="mt-1 space-y-1">
              {previewOptionalCosts.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={previewSelected.includes(c.id)}
                    onChange={() => togglePreviewSelected(c.id)}
                  />
                  {c.name || '(isimsiz)'} — {c.cost_per_person || 0} x {previewPartySize}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 space-y-1 border-t border-teal-200 pt-3 text-sm text-gray-700">
          {isSmallGroup ? (
            <div className="flex justify-between">
              <span>
                Kişi Başı Fiyat × Kişi Sayısı ({preview.pricePerPerson} × {preview.partySize}):
              </span>
              <span>{preview.baseTotal}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>
                  Seçilen Araç: {preview.vehicleTier ? `${preview.vehicleTier.vehicle_name} (${preview.vehicleTier.cost})` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sabit Maliyet Toplamı (araç + diğer):</span>
                <span>{preview.fixedTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Kâr Oranı Uygulanmış Sabit Maliyet (%{preview.markupPercent}):</span>
                <span>{preview.fixedWithMarkup}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span>Seçilen İsteğe Bağlı Kalemler Toplamı:</span>
            <span>{preview.optionalTotal}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>Ödenecek Toplam Fiyat:</span>
            <span>{preview.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
