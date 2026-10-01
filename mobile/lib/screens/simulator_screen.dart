import 'package:flutter/material.dart';
import '../components/nav_drawer.dart';
import '../services/api_service.dart';

class SimulatorScreen extends StatefulWidget {
  const SimulatorScreen({Key? key}) : super(key: key);

  @override
  State<SimulatorScreen> createState() => _SimulatorScreenState();
}

class _SimulatorScreenState extends State<SimulatorScreen> {
  final _api = ApiService();
  final _formKey = GlobalKey<FormState>();
  
  bool _loading = false;
  bool _showResult = false;
  
  // Inputs
  String _selectedDrug = 'Ibuprofen';
  String _selectedPolymer = 'Chitosan';
  final _loadingController = TextEditingController(text: '50.0');
  final _concentrationController = TextEditingController(text: '2.5');
  final _thicknessController = TextEditingController(text: '1.2');
  final _tempController = TextEditingController(text: '37.0');
  final _phController = TextEditingController(text: '6.8');
  final _moistureController = TextEditingController(text: '50.0');
  final _durationController = TextEditingController(text: '12.0');

  // Outputs
  double _predictedRelease = 0.0;
  double _peakRate = 0.0;
  String _timeTo50 = '';
  int _score = 0;
  String _riskLevel = 'Low';
  String _analysisText = '';

  List<dynamic> _drugs = [];
  List<dynamic> _polymers = [];

  @override
  void initState() {
    super.initState();
    _loadLibraries();
  }

  Future<void> _loadLibraries() async {
    try {
      final drugs = await _api.getDrugs();
      final polymers = await _api.getPolymers();
      setState(() {
        _drugs = drugs;
        _polymers = polymers;
        if (_drugs.isNotEmpty) _selectedDrug = _drugs[0]['id'];
        if (_polymers.isNotEmpty) _selectedPolymer = _polymers[0]['id'];
      });
    } catch (_) {
      // Fallbacks if backend is offline
      setState(() {
        _drugs = [
          {'id': 'Metformin', 'name': 'Metformin'},
          {'id': 'Paracetamol', 'name': 'Paracetamol'},
          {'id': 'Losartan', 'name': 'Losartan'},
          {'id': 'Ibuprofen', 'name': 'Ibuprofen'},
        ];
        _polymers = [
          {'id': 'PLA', 'name': 'PLA'},
          {'id': 'Alginate', 'name': 'Alginate'},
          {'id': 'Gelatin', 'name': 'Gelatin'},
          {'id': 'Pectin', 'name': 'Pectin'},
          {'id': 'Cellulose', 'name': 'Cellulose'},
          {'id': 'Chitosan', 'name': 'Chitosan'},
        ];
      });
    }
  }

  Future<void> _runSimulation() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _loading = true;
      _showResult = false;
    });

    final params = {
      'drugName': _selectedDrug,
      'polymerName': _selectedPolymer,
      'drugLoading': double.parse(_loadingController.text),
      'polymerConcentration': double.parse(_concentrationController.text),
      'patchThickness': double.parse(_thicknessController.text),
      'temperature': double.parse(_tempController.text),
      'pH': double.parse(_phController.text),
      'moisture': double.parse(_moistureController.text),
      'duration': double.parse(_durationController.text),
    };

    try {
      final res = await _api.runSimulation(params);
      setState(() {
        _predictedRelease = (res['predictedRelease'] as num).toDouble();
        _peakRate = (res['peakReleaseRate'] as num).toDouble();
        _timeTo50 = res['timeTo50Percent'] ?? 'N/A';
        _score = (res['controlledReleaseScore'] as num).toInt();
        _riskLevel = res['riskLevel'] ?? 'Low';
        _analysisText = res['analysis'] ?? '';
        _showResult = true;
      });
      
      // Auto-trigger report compile in background
      await _api.generateReport(res['id']);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _loadingController.dispose();
    _concentrationController.dispose();
    _thicknessController.dispose();
    _tempController.dispose();
    _phController.dispose();
    _moistureController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KINETICS SOLVER'),
      ),
      drawer: const NavDrawer(currentRoute: '/simulator'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Formulation schematic
              const Text(
                'FORMULATION SPECIFICATIONS',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      // Drug Dropdown
                      DropdownButtonFormField<String>(
                        value: _selectedDrug,
                        decoration: const InputDecoration(labelText: 'Active Drug Molecule'),
                        items: _drugs.map((d) {
                          return DropdownMenuItem<String>(
                            value: d['id'].toString(),
                            child: Text(d['name'].toString()),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedDrug = val);
                        },
                      ),
                      const SizedBox(height: 12),
                      // Polymer Dropdown
                      DropdownButtonFormField<String>(
                        value: _selectedPolymer,
                        decoration: const InputDecoration(labelText: 'Biopolymer Carrier Matrix'),
                        items: _polymers.map((p) {
                          return DropdownMenuItem<String>(
                            value: p['id'].toString(),
                            child: Text(p['name'].toString()),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedPolymer = val);
                        },
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _loadingController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Drug Load (mg)', hintText: '10-200'),
                              validator: (val) => val == null || double.tryParse(val) == null || double.parse(val) <= 0 ? 'Invalid' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _concentrationController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Polymer Conc (%)', hintText: '0.1-20'),
                              validator: (val) => val == null || double.tryParse(val) == null || double.parse(val) <= 0 ? 'Invalid' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _thicknessController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Patch Matrix Thickness (mm)', hintText: '0.1-5.0'),
                        validator: (val) => val == null || double.tryParse(val) == null || double.parse(val) <= 0 ? 'Invalid' : null,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Environment factors
              const Text(
                'SIMULATED ENVIRONMENTAL CONDITIONS',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _tempController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Temp (°C)', hintText: '10-60'),
                              validator: (val) => val == null || double.tryParse(val) == null || double.parse(val) < 10 || double.parse(val) > 60 ? 'Invalid' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _phController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Matrix pH', hintText: '0-14'),
                              validator: (val) => val == null || double.tryParse(val) == null || double.parse(val) < 0 || double.parse(val) > 14 ? 'Invalid' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _moistureController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Humidity (%)', hintText: '0-100'),
                              validator: (val) => val == null || double.tryParse(val) == null || double.parse(val) < 0 || double.parse(val) > 100 ? 'Invalid' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _durationController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Duration (h)', hintText: '1-72'),
                              validator: (val) => val == null || double.tryParse(val) == null || double.parse(val) <= 0 ? 'Invalid' : null,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Run button
              ElevatedButton(
                onPressed: _loading ? null : _runSimulation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0EA5E9),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'RUN MODEL SIMULATION',
                        style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2),
                      ),
              ),

              if (_showResult) ...[
                const SizedBox(height: 24),
                const Text(
                  'COMPUTATIONAL RESULTS',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Cumulative Release %:'),
                            Text('${_predictedRelease.toStringAsFixed(1)}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0EA5E9))),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Peak Dissolution Rate:'),
                            Text('${_peakRate.toStringAsFixed(2)}% / h', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Time to 50% Release:'),
                            Text(_timeTo50, style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const Divider(height: 24, color: Color(0xFF1E293B)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Research Score Metric:'),
                            Text('$_score/100', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Simulation Risk Indicator:'),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: _riskLevel == 'High' ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _riskLevel.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: _riskLevel == 'High' ? Colors.red[300] : Colors.green[300]
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF070913),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF1E293B)),
                          ),
                          child: Text(
                            _analysisText,
                            style: const TextStyle(fontSize: 11, color: Colors.grey, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
