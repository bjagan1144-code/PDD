import 'package:flutter_test/flutter_test.dart';
import 'package:biopatch_mobile/main.dart';

void main() {
  testWidgets('BioPatch AI mobile app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const BioPatchMobileApp());
    await tester.pump(const Duration(seconds: 1));
    expect(find.byType(BioPatchMobileApp), findsOneWidget);
  });
}
