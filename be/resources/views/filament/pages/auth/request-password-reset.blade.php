<x-filament-panels::layout.simple>
    <x-filament-panels::header.simple
        :heading="'Forgot your password?'"
        :subheading="'Enter your email address and we\'ll send you a password reset link.'"
    />

    <x-filament-panels::form wire:submit="request">
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