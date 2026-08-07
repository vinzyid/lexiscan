<?php

namespace App\Http\Controllers;

use App\Http\Middleware\IdentifyDevice;
use App\Models\Device;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class FeedbackController extends Controller
{
    /**
     * POST /api/feedback — masukan pengguna dan laporan kegagalan OCR.
     *
     * Tidak memakai kuota LLM sama sekali, tapi tetap berada di balik kunci API
     * dan throttle yang sama: tanpa itu endpoint ini jadi jalur termudah untuk
     * membanjiri database dari luar.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', Rule::in([Feedback::TYPE_FEEDBACK, Feedback::TYPE_OCR_FAILURE])],
            'message' => ['required', 'string', 'min:3', 'max:2000'],
            /*
             * Potongan teks yang gagal dibaca OCR, dikirim hanya kalau pengguna
             * menyetujuinya. Dibatasi supaya tidak berubah menjadi jalur
             * penyalinan seluruh isi buku ke server kami.
             */
            'sample' => ['nullable', 'string', 'max:2000'],
            'app_version' => ['nullable', 'string', 'max:20'],
            'platform' => ['nullable', 'string', 'max:20'],
        ]);

        try {
            Feedback::create([
                'device_id' => $this->deviceId($request),
                ...$data,
            ]);
        } catch (Throwable) {
            return response()->json([
                'message' => 'Laporan gagal dikirim. Coba lagi sebentar lagi.',
            ], 503);
        }

        return response()->json([
            'message' => 'Terima kasih, laporanmu sudah kami terima.',
        ], 201);
    }

    private function deviceId(Request $request): ?string
    {
        $device = $request->attributes->get(IdentifyDevice::ATTRIBUTE);

        return $device instanceof Device ? $device->id : null;
    }
}
