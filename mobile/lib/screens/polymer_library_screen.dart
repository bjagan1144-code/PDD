import 'package:flutter/material.dart';
import '../components/nav_drawer.dart';
import '../services/api_service.dart';

class PolymerLibraryScreen extends StatefulWidget {
  const PolymerLibraryScreen({Key? key}) : super(key: key);

  @override
  State<PolymerLibraryScreen> createState() => _PolymerLibraryScreenState();
}

class _PolymerLibraryScreenState extends State<PolymerLibraryScreen> {
  final _api = ApiService();
  bool _isLoading = true;
  List<dynamic> _polymers = [];

  @override
  void initState() {
    super.initState();
    _loadPolymers();
  }

  Future<void> _loadPolymers() async {
    setState(() => _isLoading = true);
    try {
      final polymers = await _api.getPolymers();
      setState(() {
        _polymers = polymers;
      });
    } catch (_) {
      // Offline fallback
      setState(() {
        _polymers = [
          {'id': 'PLA', 'name': 'PLA', 'type': 'Erodible', 'biodegradable': true, 'ph_response': 'Low', 'description': 'Polylactic acid (PLA) is a biodegradable, hydrophobic thermoplastic aliphatic polyester.'},
          {'id': 'Alginate', 'name': 'Alginate', 'type': 'Hydrogel', 'biodegradable': true, 'ph_response': 'Medium', 'description': 'Alginate is a natural anionic polysaccharide hydrogel widely used for cell encapsulation and drug delivery.'},
          {'id': 'Gelatin', 'name': 'Gelatin', 'type': 'Swellable Matrix', 'biodegradable': true, 'ph_response': 'High', 'description': 'Gelatin is a swellable protein matrix obtained from collagen hydrolysate, highly temperature sensitive.'},
          {'id': 'Pectin', 'name': 'Pectin', 'type': 'Swellable Matrix', 'biodegradable': true, 'ph_response': 'Medium', 'description': 'Pectin is a structural heteropolysaccharide polymer, moderately swellable and slightly pH responsive.'},
          {'id': 'Cellulose', 'name': 'Cellulose', 'type': 'Inert Matrix', 'biodegradable': true, 'ph_response': 'Low', 'description': 'Cellulose is an inert structural polysaccharide, biocompatible with low swelling indexes.'},
          {'id': 'Chitosan', 'name': 'Chitosan', 'type': 'Hydrogel', 'biodegradable': true, 'ph_response': 'High', 'description': 'Chitosan is a cationic biopolymer matrix swellable in acidic pH media.'}
        ];
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('POLYMER DATABASE'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPolymers,
          )
        ],
      ),
      drawer: const NavDrawer(currentRoute: '/polymers'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _polymers.length,
              itemBuilder: (context, index) {
                final item = _polymers[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              item['name'].toString().toUpperCase(),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0EA5E9)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                item['type'].toString().toUpperCase(),
                                style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF0EA5E9)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item['description'] ?? 'No description provided.',
                          style: const TextStyle(fontSize: 12, color: Colors.grey, height: 1.3),
                        ),
                        const Divider(height: 24, color: Color(0xFF1E293B)),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('BIODEGRADABILITY', style: TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text(item['biodegradable'] == true ? 'BIODEGRADABLE' : 'STABLE', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF10B981))),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('pH RESPONSIve LEVEL', style: TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text(item['ph_response'].toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.amber)),
                                ],
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
