<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ExtractLivewireJS extends Command
{
    protected $signature = 'livewire:extract-js';
    protected $description = 'Extract Livewire JavaScript to public folder';

    public function handle()
    {
        $this->info('Extracting Livewire JavaScript...');

        $targetDir = public_path('livewire');
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
            $this->info("Created directory: $targetDir");
        }

        $targetFile = $targetDir . '/livewire.js';

        // Try multiple possible source locations
        $possibleSources = [
            base_path('vendor/livewire/livewire/dist/livewire.js'),
            base_path('vendor/livewire/livewire/dist/livewire.umd.js'),
        ];

        $found = false;
        foreach ($possibleSources as $source) {
            if (file_exists($source)) {
                $this->info("Found Livewire at: $source");
                $content = file_get_contents($source);
                file_put_contents($targetFile, $content);
                
                $size = filesize($targetFile);
                $this->info("✓ Extracted Livewire JS: $targetFile ($size bytes)");
                $found = true;
                break;
            }
        }

        if (!$found) {
            $this->error('Could not find Livewire JS in vendor directory');
            return 1;
        }

        // Set permissions
        chmod($targetDir, 0755);
        chmod($targetFile, 0644);
        
        $this->info('✓ Livewire extraction complete!');
        return 0;
    }
}
