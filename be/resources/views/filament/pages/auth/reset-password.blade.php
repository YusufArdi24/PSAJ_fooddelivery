<x-filament-panels::layout.simple>
    <x-filament-panels::header.simple
        :heading="'Reset your password'"
        :subheading="'Enter your new password below.'"
    />

    <x-filament-panels::form wire:submit="resetPassword">
        {{ $this->form }}
        
        <x-filament-panels::form.actions
            :actions="$this->getCachedActions()"
            :full-width="true"
        />
    </x-filament-panels::form>

    <div class="text-center mt-4">
        <x-filament::link
            :href="url('/admin')"
            size="sm"
        >
            {{ __('Back to login') }}
        </x-filament::link>
    </div>
</x-filament-panels::layout.simple>