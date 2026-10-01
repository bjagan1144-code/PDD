import 'package:flutter/material.dart';
import '../components/nav_drawer.dart';
import '../services/api_service.dart';

class DrugLibraryScreen extends StatefulWidget {
  const DrugLibraryScreen({Key? key}) : super(key: key);

  @override
  State<DrugLibraryScreen> createState() => _DrugLibraryScreenState();
}

class _DrugLibraryScreenState extends State<DrugLibraryScreen> {
  final _api = ApiService();
  bool _isLoading = true;
  List<dynamic> _drugs = [];

  @override
  void initState() {
    super.initState();
    _loadDrugs();
  }

  Future<void> _loadDrugs() async {
    setState(() => _isLoading = true);
    try {
      final drugs = await _api.getDrugs();
      setState(() {
        _drugs = drugs;
      });
    } catch (_) {
      // Offline fallback
      setState(() {
        _drugs = [
          {'id': 'Metformin', 'name': 'Metformin', 'solubility': 200.0, 'molecular_weight': 129.16, 'description': 'Metformin hydrochloride is a highly water-soluble anti-diabetic biguanide drug.'},
          {'id': 'Paracetamol', 'name': 'Paracetamol', 'solubility': 14.0, 'molecular_weight': 151.16, 'description': 'Paracetamol (acetaminophen) is a widely used analgesic and antipyretic drug sparingly soluble in water.'},
          {'id': 'Losartan', 'name': 'Losartan', 'solubility': 3.3, 'molecular_weight': 422.9, 'description': 'Losartan potassium is an angiotensin II receptor antagonist used to treat high blood pressure, hydrophobic with moderate MW.'},
          {'id': 'Ibuprofen', 'name': 'Ibuprofen', 'solubility': 0.021, 'molecular_weight': 206.29, 'description': 'Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) with low water solubility.'}
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
        title: const Text('DRUG DATABASE'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDrugs,
          )
        ],
      ),
      drawer: const NavDrawer(currentRoute: '/drugs'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _drugs.length,
              itemBuilder: (context, index) {
                final item = _drugs[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          item['name'].toString().toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0EA5E9)),
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
                                  const Text('SOLUBILITY (H2O)', style: TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text('${item['solubility']} mg/mL', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('MOLECULAR WEIGHT', style: TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text('${item['molecular_weight']} g/mol', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
