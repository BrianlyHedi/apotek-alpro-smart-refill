"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, 
  Search, 
  Calendar, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  Pill, 
  AlertCircle, 
  Clock,
  Sparkles,
  Loader2,
  PlusCircle,
  Plus
} from "lucide-react";
import { useRefillSchedules, RefillScheduleItem } from "@/hooks/use-refill-schedules";
import { formatRelativeDay, formatDateShort } from "@/lib/utils/format-date";
import { QuickRefillModal } from "@/components/patient/quick-refill-modal";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";

interface MedicineOption {
  id: string;
  name: string;
  category: string;
  price: number;
  dosageForm?: string;
}

interface PatientRefillsClientProps {
  initialSchedules: RefillScheduleItem[];
  availableMedicines?: MedicineOption[];
}

export function PatientRefillsClient({
  initialSchedules,
  availableMedicines = [],
}: PatientRefillsClientProps) {
  const { schedules, isUpdating, toggleStatus } = useRefillSchedules(initialSchedules);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");
  const [selectedRefill, setSelectedRefill] = useState<{
    id: string;
    medicine: {
      id: string;
      name: string;
      price: number;
      dosageForm?: string;
    };
    frequencyDays: number;
  } | null>(null);

  // State untuk Tambah Jadwal Refill Baru
  const [isAddRefillOpen, setIsAddRefillOpen] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string>("");
  const [frequencyDays, setFrequencyDays] = useState<number>(30);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  const activeCount = schedules.filter((s) => s.isActive).length;
  const pausedCount = schedules.filter((s) => !s.isActive).length;

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.medicine.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && schedule.isActive) ||
      (filterStatus === "PAUSED" && !schedule.isActive);
    return matchesSearch && matchesFilter;
  });

  const handleCreateRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedId) {
      addToast("error", "Silakan pilih obat untuk jadwal refill");
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch("/api/refills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId: selectedMedId,
          frequencyDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan jadwal refill");

      addToast("success", "Jadwal refill obat berhasil ditambahkan!");
      setIsAddRefillOpen(false);
      setSelectedMedId("");
      setFrequencyDays(30);
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menambahkan jadwal refill");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <RefreshCw className="h-8 w-8 text-green-600" />
            Jadwal Refill Obat Rutin
          </h1>
          <p className="text-zinc-500">
            Kelola kepatuhan terapi obat kronis Anda dengan jadwal pengisian otomatis tanpa unggah resep berulang.
          </p>
        </div>

        <Button
          onClick={() => setIsAddRefillOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-sm self-start sm:self-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Jadwal Refill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-zinc-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Total Jadwal</p>
              <p className="text-2xl font-bold text-zinc-900">{schedules.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
              <Pill className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium uppercase">Jadwal Aktif</p>
              <p className="text-2xl font-bold text-emerald-700">{activeCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium uppercase">Dijeda (Paused)</p>
              <p className="text-2xl font-bold text-amber-700">{pausedCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <PauseCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Cari obat rutin kronis..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                size="sm"
                variant={filterStatus === "ALL" ? "default" : "outline"}
                className={`text-xs ${filterStatus === "ALL" ? "bg-zinc-900 text-white" : ""}`}
                onClick={() => setFilterStatus("ALL")}
              >
                Semua ({schedules.length})
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "ACTIVE" ? "default" : "outline"}
                className={`text-xs ${filterStatus === "ACTIVE" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
                onClick={() => setFilterStatus("ACTIVE")}
              >
                Aktif ({activeCount})
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "PAUSED" ? "default" : "outline"}
                className={`text-xs ${filterStatus === "PAUSED" ? "bg-amber-600 text-white hover:bg-amber-700" : ""}`}
                onClick={() => setFilterStatus("PAUSED")}
              >
                Dijeda ({pausedCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {filteredSchedules.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Pill className="h-10 w-10 mx-auto text-zinc-300 mb-2" />
              <p className="font-semibold text-sm">Tidak ada jadwal refill ditemukan</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Unggah resep dokter atau klik tombol &quot;Tambah Jadwal Refill&quot; untuk mengaktifkan pengingat terapi kronis Anda.
              </p>
              <Button
                onClick={() => setIsAddRefillOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4 text-xs font-semibold text-green-700 border-green-200 hover:bg-green-50"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Jadwal Refill Baru
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSchedules.map((schedule) => {
                const isDue = new Date(schedule.nextRefillDate) <= new Date();
                const now = new Date();
                const nextDate = new Date(schedule.nextRefillDate);
                const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isNearDue = diffDays > 0 && diffDays <= 7;

                return (
                  <div
                    key={schedule.id}
                    className={`rounded-xl border p-4 transition-all relative flex flex-col justify-between ${
                      !schedule.isActive
                        ? "bg-zinc-50/80 border-zinc-200 opacity-80"
                        : isDue || isNearDue
                        ? "bg-amber-50/50 border-amber-300 shadow-sm"
                        : "bg-white border-zinc-200 hover:border-green-300 hover:shadow-sm"
                    }`}
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-zinc-900">{schedule.medicine.name}</h3>
                            <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal">
                              {schedule.medicine.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Rp {schedule.medicine.price.toLocaleString("id-ID")}/satuan • {schedule.medicine.dosageForm || "Tablet"}
                          </p>
                        </div>

                        <Badge
                          className={`text-[10px] px-2 py-0.5 ${
                            !schedule.isActive
                              ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"
                              : isDue
                              ? "bg-red-100 text-red-700 hover:bg-red-100 animate-pulse font-bold"
                              : isNearDue
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100 font-semibold"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {!schedule.isActive
                            ? "Dijeda"
                            : isDue
                            ? "⚠️ Jatuh Tempo Hari Ini"
                            : isNearDue
                            ? `⚠️ Refill (${diffDays} Hari Lagi)`
                            : `✅ Stok Aman (${diffDays} Hari Lagi)`}
                        </Badge>
                      </div>

                      {/* Detail Siklus & Jadwal */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50/90 p-2.5 rounded-lg border border-zinc-100 mb-3">
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase font-medium">Frekuensi Terapi</p>
                          <p className="font-semibold text-zinc-800 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            Tiap {schedule.frequencyDays} hari
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 uppercase font-medium">Refill Berikutnya</p>
                          <p className={`font-semibold mt-0.5 flex items-center gap-1 ${
                            isDue || isNearDue ? "text-amber-700 font-bold" : "text-zinc-800"
                          }`}>
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            {formatDateShort(schedule.nextRefillDate)}
                          </p>
                        </div>
                      </div>

                      {schedule.lastRefillDate && (
                        <p className="text-[11px] text-zinc-400 mb-3">
                          Terakhir refill: {formatRelativeDay(schedule.lastRefillDate)}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isUpdating === schedule.id}
                        onClick={() => toggleStatus(schedule.id, !schedule.isActive)}
                        className={`text-xs h-8 px-2.5 ${
                          schedule.isActive
                            ? "text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                            : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        {isUpdating === schedule.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : schedule.isActive ? (
                          <PauseCircle className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <PlayCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {schedule.isActive ? "Jeda Jadwal" : "Aktifkan"}
                      </Button>

                      <Button
                        size="sm"
                        disabled={!schedule.isActive}
                        onClick={() =>
                          setSelectedRefill({
                            id: schedule.id,
                            medicine: schedule.medicine,
                            frequencyDays: schedule.frequencyDays,
                          })
                        }
                        className={`text-xs h-8 font-semibold shadow-sm ${
                          isDue || isNearDue
                            ? "bg-green-600 hover:bg-green-700 text-white animate-bounce-subtle"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Refill Sekarang
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Tambah Jadwal Refill Baru */}
      <Dialog open={isAddRefillOpen} onOpenChange={setIsAddRefillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-700">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Tambah Jadwal Refill Obat</DialogTitle>
                <DialogDescription className="text-xs">
                  Atur pengingat siklus terapi rutin obat kronis Anda secara berkala.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateRefill} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pilih Obat Rutin *</Label>
              <Select value={selectedMedId} onValueChange={(val) => { if (val) setSelectedMedId(val); }}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="-- Pilih Obat dari Katalog --" />
                </SelectTrigger>
                <SelectContent>
                  {availableMedicines.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{med.name}</span>
                        <span className="text-[11px] text-zinc-500">
                          ({med.category} • Rp {med.price.toLocaleString("id-ID")})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Frekuensi Siklus Terapi (Hari) *</Label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setFrequencyDays(days)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      frequencyDays === days
                        ? "bg-green-600 text-white border-green-600 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {days} Hari
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400">
                Sistem akan secara otomatis mengingatkan Anda $H-7$ sebelum jadwal jatuh tempo berikutnya.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddRefillOpen(false)} disabled={isSubmittingNew}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingNew || !selectedMedId} className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs">
                {isSubmittingNew ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                {isSubmittingNew ? "Menyimpan..." : "Simpan Jadwal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Quick Refill */}
      <QuickRefillModal
        isOpen={!!selectedRefill}
        onOpenChange={(open) => !open && setSelectedRefill(null)}
        refillItem={selectedRefill}
      />
    </div>
  );
}
