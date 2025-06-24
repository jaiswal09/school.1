import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scan, QrCode, AlertTriangle, CheckCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useInventory } from '../../hooks/useInventory';
import { useTransactions } from '../../hooks/useTransactions';

const Scanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getItemById } = useInventory();
  const { checkoutItem } = useTransactions();

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanning) {
      scanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(
        async (decodedText) => {
          setScanning(false);
          setResult(decodedText);
          
          try {
            const { data: item, error } = await getItemById(decodedText);
            if (error) throw error;
            
            if (!item) {
              setError('Item not found');
              return;
            }

            // Handle successful scan
            // You could navigate to the item details page or show a modal
            console.log('Scanned item:', item);
          } catch (err) {
            setError((err as Error).message);
          }
        },
        (error) => {
          // Ignore errors while scanning
          console.log(error);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanning, getItemById]);

  const startScanning = () => {
    setScanning(true);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">QR Code Scanner</h1>
        <p className="text-neutral-500">Scan item QR codes for quick access</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
      >
        {!scanning && !result && !error && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              Ready to Scan
            </h2>
            <p className="text-neutral-500 mb-6">
              Position the QR code within the camera frame
            </p>
            <button
              onClick={startScanning}
              className="btn btn-primary"
            >
              <Scan className="w-4 h-4 mr-2" />
              Start Scanning
            </button>
          </div>
        )}

        {scanning && (
          <div>
            <div id="reader" className="w-full max-w-lg mx-auto"></div>
            <div className="text-center mt-4">
              <button
                onClick={() => setScanning(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && !error && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              Scan Successful
            </h2>
            <p className="text-neutral-500 mb-6">
              Item ID: {result}
            </p>
            <div className="space-x-3">
              <button
                onClick={startScanning}
                className="btn btn-outline"
              >
                Scan Another
              </button>
              <button className="btn btn-primary">
                View Item Details
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-error-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              Scan Error
            </h2>
            <p className="text-error-600 mb-6">{error}</p>
            <button
              onClick={startScanning}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </motion.div>

      {/* Scanner Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-800 mb-2">Good Lighting</h3>
          <p className="text-neutral-500 text-sm">
            Ensure the QR code is well-lit and clearly visible
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-800 mb-2">Steady Camera</h3>
          <p className="text-neutral-500 text-sm">
            Hold the device steady while scanning
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-800 mb-2">Clear View</h3>
          <p className="text-neutral-500 text-sm">
            Keep the QR code centered in the frame
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;