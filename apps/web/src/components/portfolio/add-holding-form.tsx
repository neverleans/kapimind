import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Loader2 } from 'lucide-react';
import { usePortfolio, Holding, getAssetTypeLabel } from '@/lib/use-portfolio';

const HoldingSchema = z.object({
  ticker: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(['STOCK', 'FII', 'FIAGRO', 'ETF', 'CRYPTO', 'BOND']),
  quantity: z.coerce.number().positive('Quantidade > 0'),
  avgPrice: z.coerce.number().positive('Preço > 0'),
});

type HoldingFormData = z.infer<typeof HoldingSchema>;

interface Props {
  onAdded?: () => void;
}

export function AddHoldingForm({ onAdded }: Props) {
  const { addHolding, loading } = usePortfolio();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HoldingFormData>({
    resolver: zodResolver(HoldingSchema),
    defaultValues: { type: 'FII', quantity: 1, avgPrice: 0 },
  });

  async function onSubmit(data: HoldingFormData) {
    await addHolding(data);
    reset();
    setOpen(false);
    onAdded?.();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-brand-purple hover:bg-purple-600 text-white px-4 py-2 rounded-full font-semibold transition-all"
      >
        <Plus className="h-4 w-4" />
        Adicionar Holding
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-panel p-6 rounded-2xl space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Novo Holding</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Ticker</label>
          <input
            {...register('ticker')}
            placeholder="MXRF11"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm uppercase focus:outline-none focus:border-brand-purple"
          />
          {errors.ticker && <p className="text-xs text-red-400 mt-1">{errors.ticker.message}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Tipo</label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-brand-purple"
          >
            <option value="STOCK">Ação</option>
            <option value="FII">FII</option>
            <option value="FIAGRO">Fiagro</option>
            <option value="ETF">ETF</option>
            <option value="CRYPTO">Cripto</option>
            <option value="BOND">Renda Fixa</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Quantidade</label>
          <input
            {...register('quantity')}
            type="number"
            step="any"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-brand-purple"
          />
          {errors.quantity && <p className="text-xs text-red-400 mt-1">{errors.quantity.message}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Preço Médio (R$)</label>
          <input
            {...register('avgPrice')}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-brand-purple"
          />
          {errors.avgPrice && <p className="text-xs text-red-400 mt-1">{errors.avgPrice.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-brand-green hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </form>
  );
}

export { type Holding, getAssetTypeLabel };
