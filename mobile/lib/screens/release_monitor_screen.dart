import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../components/nav_drawer.dart';

class ReleaseMonitorScreen extends StatefulWidget {
  const ReleaseMonitorScreen({Key? key}) : super(key: key);

  @override
  State<ReleaseMonitorScreen> createState() => _ReleaseMonitorScreenState();
}

class _ReleaseMonitorScreenState extends State<ReleaseMonitorScreen> {
  Timer? _timer;
  
  // Telemetry state variables
  double _release = 12.4;
  double _rate = 2.4;
  double _temp = 37.0;
  double _ph = 6.8;
  double _moisture = 50.0;
  double _remaining = 87.6;

  @override
  void initState() {
    super.initState();
    _startSimulatedStream();
  }

  void _startSimulatedStream() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final rand = Random();
      setState(() {
        _release = min(100.0, _release + rand.nextDouble() * 0.4);
        _rate = max(0.5, min(5.0, _rate + (rand.nextDouble() - 0.5) * 0.3));
        _temp = max(36.5, min(37.5, _temp + (rand.nextDouble() - 0.5) * 0.1));
        _ph = max(6.6, min(7.0, _ph + (rand.nextDouble() - 0.5) * 0.05));
        _moisture = max(48.0, min(52.0, _moisture + (rand.nextDouble() - 0.5) * 0.4));
        _remaining = max(0.0, 100.0 - _release);
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Widget _buildTelemetryTile(String title, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
            Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
 
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RELEASE MONITOR'),
      ),
      drawer: const NavDrawer(currentRoute: '/release-monitor'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Warning Disclaimer Header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.05),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.withOpacity(0.15)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.sensors_rounded, color: Colors.blue, size: 20),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SIMULATED SENSOR DATA',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0EA5E9)),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Data shown represents a simulated laboratory test rig telemetry stream, not real-time clinical trials.',
                          style: TextStyle(fontSize: 9, color: Colors.grey, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Telemetry Progress meter
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const Text(
                      'CUMULATIVE DISSOLUTION PROGRESS',
                      style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 120,
                      width: 120,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          CircularProgressIndicator(
                            value: _release / 100.0,
                            strokeWidth: 10,
                            backgroundColor: Colors.blue.withOpacity(0.1),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0EA5E9)),
                          ),
                          Center(
                            child: Text(
                              '${_release.toStringAsFixed(1)}%',
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                            ),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Matrix condition: Hydrated swelling active', style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              'TELEMETRY DATA STREAM',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            _buildTelemetryTile('DISSOLUTION RATE:', '${_rate.toStringAsFixed(2)}% / hour', const Color(0xFF10B981)),
            _buildTelemetryTile('CELL MATRIX TEMP:', '${_temp.toStringAsFixed(1)} °C', Colors.amber),
            _buildTelemetryTile('HYDROGEL pH:', _ph.toStringAsFixed(2), const Color(0xFF10B981)),
            _buildTelemetryTile('RELATIVE MATRIX HUMIDITY:', '${_moisture.toStringAsFixed(1)}%', Colors.cyan),
            _buildTelemetryTile('ESTIMATED REMAINING LOAD:', '${_remaining.toStringAsFixed(1)}%', Colors.grey),
          ],
        ),
      ),
    );
  }
}
