<?php

namespace App\Observers;

use App\Models\Promo;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class PromoObserver
{
    /**
     * Handle the Promo "created" event.
     */
    public function created(Promo $promo): void
    {
        Log::info('PromoObserver created triggered', [
            'promo_id' => $promo->PromoID,
            'is_active' => $promo->is_active,
            'start_date' => $promo->start_date,
            'end_date' => $promo->end_date
        ]);
        
        // Only notify if promo is active and within valid dates
        if ($promo->is_active && $promo->start_date <= now() && $promo->end_date >= now()) {
            // Refresh to get the latest data with relationships
            $promo = $promo->fresh(['menu']);
            
            if (!$promo || !$promo->menu) {
                Log::warning('PromoObserver: Menu not found for promo', ['promo_id' => $promo->PromoID]);
                return;
            }
            
            $menuName = $promo->menu->name;
            $menuPrice = $promo->menu->price;
            $discount = $this->calculateDiscount($promo, $menuPrice);
            $discountedPrice = max(0, $menuPrice - $discount);
            
            $formattedDiscount = $promo->promo_type === 'percentage' 
                ? $promo->discount_value . '%' 
                : 'Rp ' . number_format($promo->discount_value, 0, ',', '.');
            
            $message = "Promo baru nih! {$menuName} lagi diskon {$formattedDiscount}! Dari Rp " . number_format($menuPrice, 0, ',', '.') . " jadi cuma Rp " . number_format($discountedPrice, 0, ',', '.') . " aja. Buruan order sebelum kehabisan!";
            
            try {
                Notification::createForAllCustomers(
                    'promo',
                    '🎁 Promo: ' . $menuName,
                    $message,
                    null,
                    $promo->MenuID,
                    $promo->PromoID
                );
                Log::info('Promo notification sent', ['promo_id' => $promo->PromoID, 'menu' => $menuName]);
            } catch (\Exception $e) {
                Log::error('Failed to create promo notification', [
                    'promo_id' => $promo->PromoID,
                    'error' => $e->getMessage()
                ]);
            }
        } else {
            Log::info('PromoObserver: Promo not active or not within valid dates', [
                'promo_id' => $promo->PromoID,
                'is_active' => $promo->is_active,
                'start_date' => $promo->start_date,
                'end_date' => $promo->end_date,
                'now' => now()
            ]);
        }
    }

    /**
     * Handle the Promo "updated" event.
     */
    public function updated(Promo $promo): void
    {
        // Notify when promo becomes active
        if ($promo->wasChanged('is_active') && $promo->is_active && $promo->start_date <= now() && $promo->end_date >= now()) {
            $promo = $promo->fresh(['menu']);
            
            if (!$promo || !$promo->menu) {
                return;
            }
            
            $menuName = $promo->menu->name;
            $menuPrice = $promo->menu->price;
            $discount = $this->calculateDiscount($promo, $menuPrice);
            $discountedPrice = max(0, $menuPrice - $discount);
            
            $formattedDiscount = $promo->promo_type === 'percentage' 
                ? $promo->discount_value . '%' 
                : 'Rp ' . number_format($promo->discount_value, 0, ',', '.');
            
            $message = "Promo {$menuName} aktif lagi nih! Diskon {$formattedDiscount}, jadi cuma Rp " . number_format($discountedPrice, 0, ',', '.') . ". Yuk langsung order sekarang!";
            
            try {
                Notification::createForAllCustomers(
                    'promo',
                    '🔥 Promo: ' . $menuName,
                    $message,
                    null,
                    $promo->MenuID,
                    $promo->PromoID
                );
            } catch (\Exception $e) {
                Log::error('Failed to create promo notification', [
                    'promo_id' => $promo->PromoID,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Handle the Promo "deleted" event.
     */
    public function deleted(Promo $promo): void
    {
        //
    }

    /**
     * Handle the Promo "restored" event.
     */
    public function restored(Promo $promo): void
    {
        //
    }

    /**
     * Handle the Promo "force deleted" event.
     */
    public function forceDeleted(Promo $promo): void
    {
        //
    }

    /**
     * Helper method to calculate discount amount
     */
    private function calculateDiscount(Promo $promo, $menuPrice)
    {
        if ($promo->promo_type === 'percentage') {
            $discount = $menuPrice * ($promo->discount_value / 100);
            if ($promo->max_discount) {
                $discount = min($discount, $promo->max_discount);
            }
            return $discount;
        }

        // Fixed amount - make sure discount doesn't exceed price
        return min($promo->discount_value, $menuPrice);
    }
}
