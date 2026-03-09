<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Pesanan - {{ $title }}</title>
    <style>
        @media print {
            .no-print { display: none; }
            @page { margin: 1cm; }
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            background: #ffffff;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #f59e0b;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #f59e0b;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header h2 {
            color: #666;
            font-size: 20px;
            font-weight: normal;
        }
        .period-info {
            background: #fef3c7;
            padding: 15px;
            margin-bottom: 30px;
            border-left: 4px solid #f59e0b;
        }
        .period-info strong {
            color: #92400e;
        }
        .summary-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: separate;
            border-spacing: 10px;
        }
        .summary-table td {
            width: 33.33%;
            background: #f59e0b;
            padding: 20px;
            color: white;
            text-align: center;
            border: 2px solid #d97706;
        }
        .summary-table td.revenue {
            background: #fb923c;
            border: 2px solid #f97316;
        }
        .summary-table td.discount {
            background: #fdba74;
            border: 2px solid #fb923c;
            color: #333;
        }
        .summary-table h3 {
            font-size: 12px;
            margin-bottom: 8px;
            font-weight: normal;
        }
        .summary-table .value {
            font-size: 20px;
            font-weight: bold;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .data-table thead {
            background: #f59e0b;
            color: white;
        }
        .data-table th {
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            border: 1px solid #d97706;
        }
        .data-table td {
            padding: 10px 8px;
            border: 1px solid #fed7aa;
            font-size: 10px;
        }
        .data-table .text-right {
            text-align: right;
        }
        .data-table tbody tr:nth-child(even) {
            background: #fffbf5;
        }
        .status-badge {
            padding: 3px 10px;
            font-size: 9px;
            font-weight: 500;
            display: inline-block;
        }
        .status-pending {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
        }
        .status-confirmed {
            background: #ffedd5;
            color: #9a3412;
            border: 1px solid #fdba74;
        }
        .status-delivered {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #6ee7b7;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #fed7aa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>WARUNG EDIN</h1>
            <h2>Laporan Ringkasan Pesanan</h2>
        </div>

        <div class="period-info">
            <strong>Periode:</strong> {{ $title }}<br>
            <strong>Tanggal Cetak:</strong> {{ now()->format('d/m/Y H:i') }} WIB
        </div>

        <table class="summary-table">
            <tr>
                <td>
                    <h3>Total Pesanan (Semua)</h3>
                    <div class="value">{{ $totalOrdersAll }}</div>
                    <small style="font-size: 12px; opacity: 0.9;">Termasuk pending & dikonfirmasi</small>
                </td>
                <td>
                    <h3>Pesanan Selesai</h3>
                    <div class="value">{{ $totalOrdersCompleted }}</div>
                    <small style="font-size: 12px; opacity: 0.9;">Sudah diantar/selesai</small>
                </td>
                <td class="revenue">
                    <h3>Total Pendapatan</h3>
                    <div class="value">Rp {{ number_format($totalRevenue, 0, ',', '.') }}</div>
                    <small style="font-size: 12px; opacity: 0.9;">Dari pesanan selesai</small>
                </td>
            </tr>
            <tr>
                <td class="discount">
                    <h3>Diskon (Semua Pesanan)</h3>
                    <div class="value">Rp {{ number_format($totalDiscountAll, 0, ',', '.') }}</div>
                    <small style="font-size: 12px; opacity: 0.9;">Termasuk pending & dikonfirmasi</small>
                </td>
                <td class="discount">
                    <h3>Diskon (Selesai)</h3>
                    <div class="value">Rp {{ number_format($totalDiscountCompleted, 0, ',', '.') }}</div>
                    <small style="font-size: 12px; opacity: 0.9;">Dari pesanan selesai</small>
                </td>
                <td style="background: transparent; border: none;"></td>
            </tr>
        </table>

        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 8%;">ID</th>
                    <th style="width: 15%;">Customer</th>
                    <th style="width: 15%;">Tanggal</th>
                    <th style="width: 17%;">Harga Normal</th>
                    <th style="width: 15%;">Diskon</th>
                    <th style="width: 17%;">Total (Setelah Diskon)</th>
                    <th style="width: 13%;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse($orders as $order)
                <tr>
                    <td>#{{ str_pad($order->OrderID, 5, '0', STR_PAD_LEFT) }}</td>
                    <td>{{ $order->customer->name }}</td>
                    <td>{{ $order->order_date->format('d/m/Y H:i') }}</td>
                    <td class="text-right">Rp {{ number_format($order->calculated_original_total, 0, ',', '.') }}</td>
                    <td class="text-right" style="color: #dc2626;">{{ $order->calculated_discount > 0 ? '-Rp ' . number_format($order->calculated_discount, 0, ',', '.') : '-' }}</td>
                    <td class="text-right" style="font-weight: bold; color: #16a34a;">Rp {{ number_format($order->calculated_total, 0, ',', '.') }}</td>
                    <td>
                        <span class="status-badge status-{{ $order->status }}">
                            {{ match($order->status) {
                                'pending' => 'Pending',
                                'confirmed' => 'Dikonfirmasi',
                                'delivered' => 'Diantar',
                                default => $order->status
                            } }}
                        </span>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                        Tidak ada data pesanan untuk periode ini
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <div class="footer">
            <p>Dokumen ini digenerate secara otomatis oleh sistem Warung Edin</p>
            <p>© {{ date('Y') }} Warung Edin - Semua hak dilindungi</p>
        </div>
    </div>
</body>
</html>
