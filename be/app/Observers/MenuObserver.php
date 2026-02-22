<?php

namespace App\Observers;

use App\Models\Menu;
use App\Models\Notification;

class MenuObserver
{
    /**
     * Handle the Menu "created" event.
     */
    public function created(Menu $menu): void
    {
        // Only notify if menu is available
        if ($menu->is_available) {
            $price = number_format($menu->price, 0, ',', '.');
            $category = ucfirst($menu->category);
            
            // Create casual friendly message
            $message = "Menu baru '{$menu->name}' udah ada nih! Harganya cuma Rp {$price} aja loh. Yuk cobain sekarang!";
            
            Notification::createForAllCustomers(
                'new_menu',
                '🎉 Menu Baru: ' . $menu->name,
                $message,
                null,
                $menu->MenuID
            );
        }
    }

    /**
     * Handle the Menu "updated" event.
     */
    public function updated(Menu $menu): void
    {
        // Check if price changed
        if ($menu->isDirty('price') && $menu->is_available) {
            $oldPrice = $menu->getOriginal('price');
            $newPrice = $menu->price;
            $priceDiff = $newPrice - $oldPrice;
            $isIncrease = $priceDiff > 0;
            
            $oldPriceFormatted = number_format($oldPrice, 0, ',', '.');
            $newPriceFormatted = number_format($newPrice, 0, ',', '.');
            $diffFormatted = number_format(abs($priceDiff), 0, ',', '.');
            
            if ($isIncrease) {
                $title = "📈 Harga {$menu->name} Naik";
                $message = "Waduh, harga '{$menu->name}' naik nih dari Rp {$oldPriceFormatted} jadi Rp {$newPriceFormatted}. Buruan pesan sebelum naik lagi ya!";
            } else {
                $title = "🎉 Harga {$menu->name} Turun!";
                $message = "Yeay! Harga '{$menu->name}' turun loh dari Rp {$oldPriceFormatted} jadi Rp {$newPriceFormatted}. Hemat Rp {$diffFormatted}! Buruan order sebelum promo habis!";
            }
            
            Notification::createForAllCustomers(
                'price_change',
                $title,
                $message,
                null,
                $menu->MenuID
            );
        }
    }

    /**
     * Handle the Menu "deleted" event.
     */
    public function deleted(Menu $menu): void
    {
        //
    }

    /**
     * Handle the Menu "restored" event.
     */
    public function restored(Menu $menu): void
    {
        //
    }

    /**
     * Handle the Menu "force deleted" event.
     */
    public function forceDeleted(Menu $menu): void
    {
        //
    }
}
