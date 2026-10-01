import 'package:flutter/material.dart';
import '../components/nav_drawer.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _api = ApiService();
  final _urlController = TextEditingController();
  
  bool _testing = false;
  String _healthStatus = 'Unknown';
  String _dbStatus = 'Unknown';
  String _modelStatus = 'Unknown';

  @override
  void initState() {
    super.initState();
    _urlController.text = _api.baseUrl;
    _runHealthCheck();
  }

  Future<void> _runHealthCheck() async {
    setState(() {
      _testing = true;
      _healthStatus = 'Checking...';
    });

    try {
      final res = await _api.checkHealth();
      setState(() {
        _healthStatus = res['status'] == 'ok' ? 'Online' : 'Offline';
        _dbStatus = res['database'] ?? 'Disconnected';
        _modelStatus = res['model'] ?? 'Unavailable';
      });
    } catch (_) {
      setState(() {
        _healthStatus = 'Offline';
        _dbStatus = 'Disconnected';
        _modelStatus = 'Unavailable';
      });
    } finally {
      setState(() {
        _testing = false;
      });
    }
  }

  Future<void> _saveConfig() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    await _api.setBaseUrl(url);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('API Base URL configuration updated.')),
    );
    _runHealthCheck();
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SYSTEM CONFIG'),
      ),
      drawer: const NavDrawer(currentRoute: '/settings'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'FASTAPI SERVER ENDPOINT',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    TextField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: 'API Gateway Endpoint',
                        hintText: 'http://10.0.2.2:8000/api',
                        helperText: 'Android Emulator default is http://10.0.2.2:8000/api',
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _saveConfig,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0EA5E9),
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('SAVE ENDPOINT CONFIG', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'GATEWAY DIAGNOSTICS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('FastAPI Server Status:', style: TextStyle(fontSize: 13)),
                        Text(
                          _healthStatus,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _healthStatus == 'Online' ? Colors.green[300] : Colors.red[300]
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('SQLite Database:', style: TextStyle(fontSize: 13)),
                        Text(
                          _dbStatus.toUpperCase(),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _dbStatus == 'connected' ? Colors.green[300] : Colors.grey
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Random Forest ML Model:', style: TextStyle(fontSize: 13)),
                        Text(
                          _modelStatus.toUpperCase(),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _modelStatus == 'loaded' ? Colors.purple[300] : Colors.grey
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24, color: Color(0xFF1E293B)),
                    ElevatedButton.icon(
                      onPressed: _testing ? null : _runHealthCheck,
                      icon: const Icon(Icons.sync_rounded),
                      label: const Text('RUN DIAGNOSTICS TEST'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E293B),
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: const BorderSide(color: Color(0xFF334155)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
