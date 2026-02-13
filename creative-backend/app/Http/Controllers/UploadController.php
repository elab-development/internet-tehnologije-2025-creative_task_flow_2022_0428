<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UploadController extends Controller
{
    public function uploadTo0x0(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB, po potrebi menjaj
        ]);

        $file = $request->file('file');

        // prosledi fajl na 0x0.st
        $response = Http::attach(
            'file',
            file_get_contents($file->getRealPath()),
            $file->getClientOriginalName()
        )->post('https://0x0.st');

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Upload na 0x0.st nije uspeo.',
                'errors' => (object)[
                    'file' => ['Greška pri slanju fajla na eksterni servis.'],
                ],
            ], 500);
        }

        $url = trim($response->body());

        if (!str_starts_with($url, 'http')) {
            return response()->json([
                'success' => false,
                'message' => 'Neispravan odgovor sa 0x0.st.',
                'errors' => (object)[
                    'file' => ['Servis nije vratio validan URL.'],
                ],
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Fajl je uspešno uploadovan.',
            'data' => [
                'url' => $url,
            ],
        ]);
    }
}
