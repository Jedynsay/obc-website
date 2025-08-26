"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useConfirmation } from "../../contexts/ConfirmationContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

//
// Types
//
interface Tournament {
  id: string;
  name: string;
  description?: string;
  is_free: boolean;
  beyblades_per_player: number;
}

interface TournamentRegistrationProps {
  tournament: Tournament;
  onClose: () => void;
}

interface DeckPreset {
  id: string;
  name: string;
}

interface Part {
  id: string;
  name: string;
  type: string; // bit_chip | energy_layer | forge_disc | performance_tip | driver
  blade_line: string; // basic | unique | x-over | custom
}

interface BladeOption {
  id: string;
  name: string;
  blade_line: string;
}

//
// Component
//
export function TournamentRegistration({ tournament, onClose }: TournamentRegistrationProps) {
  const { user } = useAuth();
  const { alert } = useConfirmation();

  const [playerName, setPlayerName] = useState("");
  const [paymentMode, setPaymentMode] = useState<"free" | "cash" | "gcash" | "bank_transfer">(
    tournament.is_free ? "free" : "cash"
  );
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "confirmed">(
    tournament.is_free ? "confirmed" : "pending"
  );
  const [deckPresets, setDeckPresets] = useState<DeckPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [partsData, setPartsData] = useState<Part[]>([]);
  const [customDeck, setCustomDeck] = useState<Record<string, string>>({});
  const [isCustomLine, setIsCustomLine] = useState(false);
  const [bladeOptions, setBladeOptions] = useState<BladeOption[]>([]);
  const [selectedBlades, setSelectedBlades] = useState<string[]>([]);
  const [existingPlayerNames, setExistingPlayerNames] = useState<string[]>([]);

  //
  // Effects
  //
  useEffect(() => {
    if (!user) return;
    loadDeckPresets();
    loadParts();
    loadBladeOptions();
    loadExistingPlayers();
  }, [user]);

  //
  // Loaders
  //
  async function loadDeckPresets() {
    const { data } = await supabase
      .from("deck_presets")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setDeckPresets(data);
  }

  async function loadParts() {
    const { data } = await supabase.from("parts").select("*").order("name", { ascending: true });
    if (data) setPartsData(data);
  }

  async function loadBladeOptions() {
    const { data } = await supabase
      .from("blades")
      .select("id, name, blade_line")
      .not("blade_line", "eq", "custom")
      .order("name", { ascending: true });

    if (data) setBladeOptions(data);
  }

  async function loadExistingPlayers() {
    const { data } = await supabase
      .from("tournament_registrations")
      .select("player_name")
      .eq("tournament_id", tournament.id);

    if (data) setExistingPlayerNames(data.map((row) => row.player_name));
  }

  //
  // Helpers
  //
  function getPartOptions(partType: string) {
    return partsData.filter((p) => p.type === partType && p.blade_line === "custom");
  }

  const isFormValid = () => {
    if (!playerName.trim()) return false;
    if (existingPlayerNames.includes(playerName.trim())) return false;

    if (isCustomLine) {
      return (
        customDeck["bit_chip"] &&
        customDeck["energy_layer"] &&
        customDeck["forge_disc"] &&
        customDeck["performance_tip"] &&
        customDeck["driver"]
      );
    } else {
      return selectedBlades.length === tournament.beyblades_per_player;
    }
  };

  //
  // Submit
  //
  async function handleSubmit() {
    if (!user) return;
    if (!isFormValid()) {
      alert("Please complete all required fields.");
      return;
    }

    const { error } = await supabase.from("tournament_registrations").insert({
      tournament_id: tournament.id,
      user_id: user.id,
      player_name: playerName.trim(),
      status: paymentStatus === "confirmed" ? "confirmed" : "pending",
      payment_mode: paymentMode,
      payment_status: paymentStatus,
      deck_preset_id: selectedPreset || null,
      deck_configuration: isCustomLine
        ? { type: "custom", parts: customDeck }
        : { type: "preset", blades: selectedBlades },
    });

    if (error) {
      console.error("Error registering for tournament:", error);
      alert("Registration failed.");
      return;
    }

    alert("Successfully registered!");
    onClose();
  }

  //
  // Render
  //
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Register for {tournament.name}
            <span className="ml-3 text-sm text-muted-foreground">{tournament.description}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player Name */}
          <div>
            <Label htmlFor="playerName">Player Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
            />
            {existingPlayerNames.includes(playerName.trim()) && (
              <p className="text-xs text-red-500 mt-1">This player name is already taken.</p>
            )}
          </div>

          {/* Payment Mode */}
          {!tournament.is_free && (
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(val) => setPaymentMode(val as typeof paymentMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Deck Preset */}
          <div>
            <Label htmlFor="preset">Deck Preset (optional)</Label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select deck preset" />
              </SelectTrigger>
              <SelectContent>
                {deckPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Line Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="customLine">Custom Line</Label>
            <Switch id="customLine" checked={isCustomLine} onCheckedChange={setIsCustomLine} />
          </div>

          {/* Blade / Parts Section */}
          {isCustomLine ? (
            <div className="space-y-2">
              <Label>Custom Parts</Label>
              {["bit_chip", "energy_layer", "forge_disc", "performance_tip", "driver"].map((type) => (
                <Select
                  key={type}
                  value={customDeck[type] || ""}
                  onValueChange={(val) => setCustomDeck((prev) => ({ ...prev, [type]: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${type.replace("_", " ")}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getPartOptions(type).map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Blades</Label>
              {[...Array(tournament.beyblades_per_player)].map((_, i) => (
                <Select
                  key={i}
                  value={selectedBlades[i] || ""}
                  onValueChange={(val) =>
                    setSelectedBlades((prev) => {
                      const updated = [...prev];
                      updated[i] = val;
                      return updated;
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select Blade ${i + 1}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {bladeOptions.map((blade) => (
                      <SelectItem key={blade.id} value={blade.id}>
                        {blade.name} ({blade.blade_line})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
